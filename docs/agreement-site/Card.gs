/* ══════════════════════════════════════════════════════════════════════════
 * CARD PURCHASE AGREEMENT — added 2026-10-04 for Square card payments on the
 * website (owner decision D9: EVERY card payment needs the signed agreement).
 *
 * This file sits NEXT TO Code.gs in the same Apps Script project and reuses
 * its helpers (json_, parseBody_, fetch/cache pattern, sheet header helpers,
 * PDF style helpers, savePdf_, sendMail). Code.gs needs only TWO one-line
 * hooks, marked "CARD HOOK 1/2", plus running cjInstallCardPdfTrigger() once.
 *
 * The signing page is card.html on agreement.chajewelsjp.com. The wording is
 * card-agreement-2026-v1.json (ENGLISH is the agreement; Japanese is a
 * translation behind a toggle — owner 2026-10-04 02:28). One. The record is one row in the 'Card Agreements' tab
 * keyed by the Hub ORDER ID (cash_orders.id), plus a PDF in Drive and an
 * email to the customer. The storefront verifies the signature with
 *   GET …/exec?sig=1&doc=card&order=<uuid>&token=<CJ_LOOKUP_TOKEN>
 * → {ok:true, signed:true, agreement_version, signed_at, bound, customer_id?, amount_jpy?} | {ok:true, signed:false}  (v3 2026-10-04: bound + customer + amount from the signed link)
 * Same token property, same fail-closed shape as the layaway lookup.
 * Nothing in the layaway path is touched.
 * ════════════════════════════════════════════════════════════════════════ */

const CARD_SHEET_NAME = 'Card Agreements';
const CARD_LOG_SHEET_NAME = 'Card Signatures';
const CARD_AGREEMENT_JSON_URL = 'https://agreement.chajewelsjp.com/card-agreement-2026-v1.json';
const CARD_PDF_FOLDER_NAME = 'ChaJewels_Card_PDFs';

const CARD_HEADERS = [
  'Timestamp',
  'Full Name',
  'Email',
  'Country',
  'Order ID',
  'Order Reference',
  'Signed At',
  'Agreement Version',
  'Locale',
  'Signature URL',
  'Signature File ID',
  'Cha Jewels Digital Signature',
  'PDF Status',
  // v3 (2026-10-04, owner 5A): who the storefront signed the link for, the
  // amount she saw, and whether that signed context verified.
  'Customer ID',
  'Amount JPY',
  'Context Verified'
];

const CARD_LOG_HEADERS = [
  'Timestamp', 'Full Name', 'Email', 'Country', 'Order ID', 'Order Reference',
  'Signature URL', 'Drive File ID', 'Agreement Version', 'Locale'
];

const CARD_UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/* ══════════════════════════════════════════════════════════════════════════
 * v3 (2026-10-04, owner decision 5A; Square review SQ20) — AGREEMENT BINDING.
 * The storefront's signing link carries ?ctx=<payload>.<signature>:
 *   payload   = base64url(JSON {o: orderId, c: customerId, a: amountJpy, v: 1, e: unixSeconds})
 *   signature = base64url(HMAC-SHA256(key = CJ_LOOKUP_TOKEN, message = payload))
 * (base64url = the URL-safe alphabet, no '=' padding; the key is the SAME
 * Script Property the lookup already uses, so there is nothing new to set.)
 * A signature is saved only when the context verifies and names the same
 * order; the customer id and amount are stored with it and the lookup answers
 * them back with bound:true. The storefront lets her pay only when that
 * customer and amount are exactly the order's — a changed amount means she
 * signs again (a new row; the newest row wins).
 * ════════════════════════════════════════════════════════════════════════ */
function cjB64UrlNoPad_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function cjB64UrlDecodeToString_(s) {
  var t = String(s || '');
  while (t.length % 4) t += '=';
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(t)).getDataAsString('UTF-8');
}

/** Verifies the signed context. Returns {ok:true, customerId, amountJpy} or {ok:false, reason}. */
function cjVerifyCardContext_(ctx, orderId) {
  var key = PropertiesService.getScriptProperties().getProperty(CJ_SIG_LOOKUP.TOKEN_PROPERTY);
  if (!key) return { ok: false, reason: 'not_configured' };
  var raw = String(ctx || '').trim();
  var dot = raw.indexOf('.');
  if (!raw || dot < 1 || dot !== raw.lastIndexOf('.')) return { ok: false, reason: 'missing' };
  var payloadB64 = raw.slice(0, dot);
  var sigB64 = raw.slice(dot + 1);
  var expected = cjB64UrlNoPad_(Utilities.computeHmacSha256Signature(payloadB64, key));
  if (!cjSafeEquals_(sigB64, expected)) return { ok: false, reason: 'bad_signature' };
  var p;
  try { p = JSON.parse(cjB64UrlDecodeToString_(payloadB64)); } catch (err) { return { ok: false, reason: 'bad_payload' }; }
  if (!p || p.v !== 1) return { ok: false, reason: 'bad_version' };
  if (String(p.o || '') !== String(orderId || '')) return { ok: false, reason: 'other_order' };
  if (!CARD_UUID_RE.test(String(p.c || ''))) return { ok: false, reason: 'bad_customer' };
  if (typeof p.a !== 'number' || !isFinite(p.a) || Math.floor(p.a) !== p.a || p.a <= 0) return { ok: false, reason: 'bad_amount' };
  if (typeof p.e !== 'number' || p.e * 1000 < Date.now()) return { ok: false, reason: 'expired' };
  return { ok: true, customerId: String(p.c), amountJpy: p.a };
}

/** CARD HOOK 1 (doPostInner_, right after the trade route): `if (cjIsCardPost_(data)) return cjHandleCardPost_(e, data);` */
function cjIsCardPost_(data) {
  return !!data && String(data.doc || '') === 'card';
}

/** The POST from card.html. Writes the row and returns at once; the PDF and
 *  the email follow from cjProcessCardPdfQueue() (time-driven trigger). */
function cjHandleCardPost_(e, data) {
  try {
    const fullName  = (data.fullName || '').toString().trim();
    const email     = normalizeEmail_(data.email || '');
    const country   = (data.country || '').toString().trim();
    const orderNum  = (data.orderNumber || '').toString().trim();
    const orderId   = (data.orderId || '').toString().trim();
    const localeRaw = (data.locale || 'en').toString().trim();
    const locale    = localeRaw === 'ja' ? 'ja' : 'en';
    const signedAt  = data.signedAt || new Date().toISOString();
    const sigData   = data.signatureDataURL;
    const cjSigText = (data.cjDigitalSig || 'Digitally signed by Cha Jewels Co., Ltd.').toString().trim();

    if (!fullName || !email || !country || !orderNum) {
      return json_({ ok: false, version: VERSION, where: 'validation', message: 'Missing required fields.' });
    }
    if (!isValidEmail_(email)) {
      return json_({ ok: false, version: VERSION, where: 'validation', message: 'Invalid email format.' });
    }
    // The order id is THE key the storefront looks up. Without a real one the
    // signature could never be matched to a payment, so it is refused.
    if (!CARD_UUID_RE.test(orderId)) {
      return json_({ ok: false, version: VERSION, where: 'validation', message: 'This link is missing the order. Open the agreement from your order page.' });
    }
    if (!sigData || !/^data:image\/png;base64,/.test(sigData)) {
      return json_({ ok: false, version: VERSION, where: 'validation', message: 'Missing or invalid signature image.' });
    }
    // v3: the signed context binds this signature to the customer and amount.
    const ctxCheck = cjVerifyCardContext_(data.ctx, orderId);
    if (!ctxCheck.ok) {
      return json_({
        ok: false, version: VERSION, where: 'context', reason: ctxCheck.reason,
        message: 'This signing link is not valid any more. Please open the agreement again from your order page.'
      });
    }

    let agreement;
    try {
      agreement = cjFetchCardAgreement_();
    } catch (agErr) {
      return json_({
        ok: false, version: VERSION, where: 'agreement',
        message: 'The agreement text could not be loaded. Nothing was saved. Please try again shortly.',
        detail: String(agErr)
      });
    }
    const agreementVersion = agreement.version;
    const clientVersion = (data.agreementVersion || '').toString().trim();
    if (clientVersion && clientVersion !== agreementVersion) {
      return json_({
        ok: false, version: VERSION, where: 'version_mismatch',
        message: 'The agreement was updated while this page was open. Please refresh and sign the current version.'
      });
    }

    try { DriveApp.getFileById(SPREADSHEET_ID); }
    catch (permErr) {
      const execUser = Session.getEffectiveUser().getEmail();
      return json_({ ok: false, version: VERSION, where: 'permissions', message: `Share the sheet with ${execUser} (Editor). Detail: ${String(permErr)}` });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ensureHeadersNonDestructive_(ss, CARD_SHEET_NAME, CARD_HEADERS, {});

    // Duplicate guard: the same ORDER signed under the same version is a
    // retried click, not a second agreement. A new version may be re-signed.
    const dup = cjFindCardAgreement_(sh, orderId, agreementVersion, ctxCheck.customerId, ctxCheck.amountJpy);
    if (dup.found) {
      return json_({
        ok: true, version: VERSION, duplicate: true, agreementVersion,
        message: 'This order was already signed under the current agreement version.',
        pdfUrl: dup.pdfUrl || '', signedAt: dup.signedAt || ''
      });
    }

    const signatureFile = cjSaveCardSignatureImage_(sigData, fullName, signedAt);

    const idxMap = getHeaderIndexMapWithAliases_(sh);
    const lastCol = sh.getLastColumn();
    const row = new Array(lastCol).fill('');
    setByHeader_(row, idxMap, 'Timestamp', new Date());
    setByHeader_(row, idxMap, 'Full Name', fullName);
    setByHeader_(row, idxMap, 'Email', email);
    setByHeader_(row, idxMap, 'Country', country);
    setByHeader_(row, idxMap, 'Order ID', orderId);
    setByHeader_(row, idxMap, 'Order Reference', orderNum);
    setByHeader_(row, idxMap, 'Signed At', signedAt);
    setByHeader_(row, idxMap, 'Agreement Version', agreementVersion);
    setByHeader_(row, idxMap, 'Locale', locale);
    setByHeader_(row, idxMap, 'Signature URL', '');
    setByHeader_(row, idxMap, 'Signature File ID', signatureFile.getId());
    setByHeader_(row, idxMap, 'Cha Jewels Digital Signature', cjSigText);
    setByHeader_(row, idxMap, 'PDF Status', PDF_STATUS_QUEUED);
    setByHeader_(row, idxMap, 'Customer ID', ctxCheck.customerId);
    setByHeader_(row, idxMap, 'Amount JPY', ctxCheck.amountJpy);
    setByHeader_(row, idxMap, 'Context Verified', 'yes');
    sh.appendRow(row);
    SpreadsheetApp.flush();

    return json_({
      ok: true, version: VERSION, agreementVersion, locale,
      message: 'Saved. PDF and email follow within a minute.',
      tab: sh.getName(), appendedRow: sh.getLastRow(),
      orderId, invoiceNumber: orderNum, pdfUrl: '', mailSent: false
    });
  } catch (err) {
    Logger.log('[card] doPost error: %s', err);
    return json_({ ok: false, version: VERSION, where: 'card_topcatch', message: String(err) });
  }
}

/** CARD HOOK 2 (doGet, FIRST line): `if (e && e.parameter && e.parameter.sig === '1' && e.parameter.doc === 'card') return cjHandleCardLookup_(e);` */
function cjHandleCardLookup_(e) {
  var p = (e && e.parameter) || {};
  var expected = PropertiesService.getScriptProperties().getProperty(CJ_SIG_LOOKUP.TOKEN_PROPERTY);
  if (!expected) return cjJson_({ ok: false, error: 'not_configured' });
  if (!cjSafeEquals_(p.token, expected)) return cjJson_({ ok: false, error: 'unauthorized' });

  var order = String(p.order == null ? '' : p.order).trim();
  if (!CARD_UUID_RE.test(order)) return cjJson_({ ok: false, error: 'bad_request' });

  try {
    var sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CARD_SHEET_NAME);
    // No tab yet = nobody has signed anything = not signed (not a fault).
    if (!sh) return cjJson_({ ok: true, signed: false });
    var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return cjJson_({ ok: true, signed: false });

    var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h == null ? '' : h).trim(); });
    var cOrder = headers.indexOf('Order ID') + 1;
    var cVersion = headers.indexOf('Agreement Version') + 1;
    var cSignedAt = headers.indexOf('Signed At') + 1;
    var cCustomer = headers.indexOf('Customer ID') + 1;
    var cAmount = headers.indexOf('Amount JPY') + 1;
    var cVerified = headers.indexOf('Context Verified') + 1;
    if (cOrder < 1) return cjJson_({ ok: false, error: 'lookup_failed' });

    // Bottom-up: append-only, so the last match is the newest signature.
    var col = sh.getRange(2, cOrder, lastRow - 1, 1).getValues();
    var hitRow = -1;
    for (var i = col.length - 1; i >= 0; i--) {
      if (String(col[i][0] == null ? '' : col[i][0]).trim() === order) { hitRow = i + 2; break; }
    }
    if (hitRow < 0) return cjJson_({ ok: true, signed: false });

    var row = sh.getRange(hitRow, 1, 1, lastCol).getValues()[0];
    var version = cVersion > 0 ? String(row[cVersion - 1] == null ? '' : row[cVersion - 1]).trim() : '';
    var signedAt = '';
    if (cSignedAt > 0) {
      var raw = row[cSignedAt - 1];
      if (raw instanceof Date) signedAt = raw.toISOString();
      else if (raw) signedAt = String(raw).trim();
    }
    // v3: who it binds and for how much — only from a verified signed link.
    var customerId = cCustomer > 0 ? String(row[cCustomer - 1] == null ? '' : row[cCustomer - 1]).trim() : '';
    var amountRaw = cAmount > 0 ? row[cAmount - 1] : '';
    var amountJpy = (amountRaw === '' || amountRaw == null) ? null : Number(amountRaw);
    var verified = cVerified > 0 && String(row[cVerified - 1] == null ? '' : row[cVerified - 1]).trim() === 'yes';
    var bound = verified && CARD_UUID_RE.test(customerId) && typeof amountJpy === 'number' && isFinite(amountJpy) && amountJpy > 0;
    var out = { ok: true, signed: true, agreement_version: version, signed_at: signedAt, bound: bound };
    if (bound) { out.customer_id = customerId; out.amount_jpy = amountJpy; }
    return cjJson_(out);
  } catch (err) {
    console.error('[cjCardLookup] ' + (err && err.message ? err.message : String(err)));
    return cjJson_({ ok: false, error: 'lookup_failed' });
  }
}

/*************** AGREEMENT SOURCE (card) ***************/
function cjFetchCardAgreement_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('card_agreement_json');
  if (cached) { try { return JSON.parse(cached); } catch (_) {} }
  const resp = UrlFetchApp.fetch(CARD_AGREEMENT_JSON_URL, { muteHttpExceptions: true, followRedirects: true, headers: { 'Cache-Control': 'no-cache' } });
  const code = resp.getResponseCode();
  if (code !== 200) throw new Error('Card agreement fetch failed: HTTP ' + code);
  const text = resp.getContentText();
  const parsed = JSON.parse(text);
  if (!parsed.version || !parsed.locales || !parsed.locales.en || !parsed.locales.ja) {
    throw new Error('Card agreement file is missing version or the en/ja locales.');
  }
  cache.put('card_agreement_json', text, AGREEMENT_CACHE_SECONDS);
  return parsed;
}

/** Run by hand after editing card-agreement-*.json so the next PDF picks it up at once. */
function clearCardAgreementCache() {
  CacheService.getScriptCache().remove('card_agreement_json');
  Logger.log('Card agreement cache cleared. Current version: ' + cjFetchCardAgreement_().version);
}

function cjFindCardAgreement_(sheet, orderId, agreementVersion, customerId, amountJpy) {
  const idxMap = getHeaderIndexMapWithAliases_(sheet);
  if (!('Order ID' in idxMap)) return { found: false };
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { found: false };
  const n = lastRow - 1;
  const orders = sheet.getRange(2, idxMap['Order ID'] + 1, n, 1).getValues().map(r => String(r[0] || '').trim());
  const versions = ('Agreement Version' in idxMap) ? sheet.getRange(2, idxMap['Agreement Version'] + 1, n, 1).getValues().map(r => String(r[0] || '').trim()) : new Array(n).fill('');
  const urls = ('Signature URL' in idxMap) ? sheet.getRange(2, idxMap['Signature URL'] + 1, n, 1).getValues().map(r => String(r[0] || '').trim()) : new Array(n).fill('');
  const signed = ('Signed At' in idxMap) ? sheet.getRange(2, idxMap['Signed At'] + 1, n, 1).getValues().map(r => (r[0] instanceof Date ? r[0].toISOString() : String(r[0] || '').trim())) : new Array(n).fill('');
  // v3: a retried click repeats the same order, version, customer AND amount.
  // A changed amount is a new signature (she signs again), never a duplicate.
  const customers = ('Customer ID' in idxMap) ? sheet.getRange(2, idxMap['Customer ID'] + 1, n, 1).getValues().map(r => String(r[0] || '').trim()) : new Array(n).fill('');
  const amounts = ('Amount JPY' in idxMap) ? sheet.getRange(2, idxMap['Amount JPY'] + 1, n, 1).getValues().map(r => (r[0] === '' || r[0] == null ? null : Number(r[0]))) : new Array(n).fill(null);
  for (let i = n - 1; i >= 0; i--) {
    if (orders[i] === orderId && (!versions[i] || versions[i] === agreementVersion)
        && customers[i] === String(customerId || '') && amounts[i] === amountJpy) {
      return { found: true, rowIndex: i + 2, pdfUrl: urls[i], signedAt: signed[i] };
    }
  }
  return { found: false };
}

function cjSaveCardSignatureImage_(dataURL, fullName, signedAt) {
  const blob = dataUrlToBlob_(dataURL, `cardsig_${sanitize_(fullName)}_${new Date(signedAt).toISOString().substring(0, 19).replace(/[:T]/g, '')}.png`);
  return getOrCreateFolder_(CARD_PDF_FOLDER_NAME).createFile(blob);
}

/*************** PDF QUEUE (card) ***************
 * Same pattern as cjProcessPdfQueue in Code.gs, on the card tab.
 * Run cjInstallCardPdfTrigger() ONCE from the editor.
 *************************************************************/
function cjInstallCardPdfTrigger() {
  const existing = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'cjProcessCardPdfQueue');
  if (existing.length) { Logger.log('Card trigger already installed (' + existing.length + ').'); return; }
  ScriptApp.newTrigger('cjProcessCardPdfQueue').timeBased().everyMinutes(1).create();
  Logger.log('Installed: cjProcessCardPdfQueue every 1 minute.');
}

function cjProcessCardPdfQueue() {
  const lock = LockService.getScriptLock();
  let ss, sh, idxMap, statusCol, todo = [];
  if (!lock.tryLock(5000)) { Logger.log('[card queue] busy, skipping this run'); return; }
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    sh = ss.getSheetByName(CARD_SHEET_NAME);
    if (!sh) return;
    idxMap = getHeaderIndexMapWithAliases_(sh);
    statusCol = findCol_(idxMap, ['PDF Status']);
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return;
    const statuses = sh.getRange(2, statusCol, lastRow - 1, 1).getValues();
    for (let i = 0; i < statuses.length && todo.length < PDF_QUEUE_BATCH; i++) {
      if (String(statuses[i][0] || '').trim() === PDF_STATUS_QUEUED) todo.push(i + 2);
    }
    todo.forEach(rowNum => sh.getRange(rowNum, statusCol).setValue(PDF_STATUS_PROCESSING));
    SpreadsheetApp.flush();
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
  if (!todo.length) return;

  let agreement;
  try { agreement = cjFetchCardAgreement_(); }
  catch (agErr) {
    Logger.log('[card queue] agreement fetch failed, rows returned to queue: ' + agErr);
    todo.forEach(rowNum => sh.getRange(rowNum, statusCol).setValue(PDF_STATUS_QUEUED));
    return;
  }

  todo.forEach(rowNum => {
    try {
      cjProcessCardRow_(ss, sh, idxMap, rowNum, agreement);
    } catch (err) {
      Logger.log('[card queue] row ' + rowNum + ' failed: ' + err);
      sh.getRange(rowNum, statusCol).setValue('error: ' + String(err).substring(0, 200));
    }
  });
  SpreadsheetApp.flush();
}

function cjProcessCardRow_(ss, sh, idxMap, rowNum, agreement) {
  const row = sh.getRange(rowNum, 1, 1, sh.getLastColumn()).getValues()[0];
  const get = (h) => (h in idxMap) ? row[idxMap[h]] : '';
  const fullName = String(get('Full Name') || '').trim();
  const email = normalizeEmail_(String(get('Email') || ''));
  const country = String(get('Country') || '').trim();
  const orderId = String(get('Order ID') || '').trim();
  const orderNum = String(get('Order Reference') || '').trim();
  const signedRaw = get('Signed At');
  const signedAt = signedRaw instanceof Date ? signedRaw.toISOString() : (String(signedRaw || '').trim() || new Date().toISOString());
  const cjSigText = String(get('Cha Jewels Digital Signature') || 'Digitally signed by Cha Jewels Co., Ltd.').trim();
  const locale = String(get('Locale') || 'en').trim() === 'ja' ? 'ja' : 'en';
  const sigFileId = String(get('Signature File ID') || '').trim();
  const rowVersion = String(get('Agreement Version') || '').trim();
  if (!sigFileId) throw new Error('no Signature File ID');
  if (rowVersion && rowVersion !== agreement.version) throw new Error('row version ' + rowVersion + ' != current ' + agreement.version);

  const signatureBlob = DriveApp.getFileById(sigFileId).getBlob().setName(`cardsig_${sanitize_(fullName)}.png`);
  const pdfBlob = cjGenerateCardPdf_({ fullName, email, country, orderId, orderNum, signedAt, cjSigText, signatureBlob, agreement, locale });
  const pdfForEmail = pdfBlob.copyBlob(); pdfForEmail.setName(pdfBlob.getName()); pdfForEmail.setContentType('application/pdf');

  const folder = getOrCreateFolder_(CARD_PDF_FOLDER_NAME);
  const datePart = new Date(signedAt).toISOString().substring(0, 10);
  const file = folder.createFile(pdfBlob.setName(`CardPurchaseAgreement_${sanitize_(fullName)}_${sanitize_(orderNum)}_${datePart}.pdf`));
  const pdfUrl = file.getUrl();

  sh.getRange(rowNum, findCol_(idxMap, ['Signature URL'])).setValue(pdfUrl);
  const log = cjEnsureCardLog_(ss);
  log.appendRow([new Date(), fullName, email, country, orderId, orderNum, pdfUrl, file.getId(), agreement.version, locale]);

  let status = PDF_STATUS_DONE;
  if (!DEBUG_SKIP_EMAIL) {
    try { cjSendCardMail_(email, pdfForEmail, { fullName, orderNum, agreementVersion: agreement.version, locale }); }
    catch (mailErr) { Logger.log('[card queue] mail error row ' + rowNum + ': ' + mailErr); status = 'done (email failed: ' + String(mailErr).substring(0, 150) + ')'; }
  }
  sh.getRange(rowNum, findCol_(idxMap, ['PDF Status'])).setValue(status);
  try { DriveApp.getFileById(sigFileId).setTrashed(true); } catch (_) {}
}

function cjEnsureCardLog_(ss) {
  let sh = ss.getSheetByName(CARD_LOG_SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(CARD_LOG_SHEET_NAME); sh.getRange(1, 1, 1, CARD_LOG_HEADERS.length).setValues([CARD_LOG_HEADERS]); }
  else if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, CARD_LOG_HEADERS.length).setValues([CARD_LOG_HEADERS]);
  return sh;
}

/** ===== EMAIL (card) ===== */
function cjSendCardMail_(toEmail, pdfBlob, { fullName, orderNum, agreementVersion, locale }) {
  if (!toEmail || !/@/.test(toEmail)) throw new Error('Invalid recipient email');
  const pdf = pdfBlob.getContentType() === 'application/pdf' ? pdfBlob : pdfBlob.copyBlob().setContentType('application/pdf');
  if (!pdf.getName() || !/\.pdf$/i.test(pdf.getName())) pdf.setName('Card_Purchase_Agreement.pdf');
  if (!pdf.getBytes() || pdf.getBytes().length === 0) throw new Error('PDF blob is empty — cannot attach to email.');
  const ja = locale === 'ja';
  const subject = ja
    ? 'ご署名済みのカード購入同意書 — ご注文 ' + orderNum
    : 'Your signed Cha Jewels Card Purchase Agreement — Order ' + orderNum;
  const bodyText = ja
    ? `${fullName} 様

株式会社チャジュエルズのカード購入同意書にご署名いただき、ありがとうございます。
ご署名入りの同意書のPDFを添付いたします。

ご注文：${orderNum}
同意書バージョン：${agreementVersion}

このメールは記録として保管してください。カードへの請求は、スタッフがご注文を確認した後に行われます。

株式会社チャジュエルズ`
    : `Dear ${fullName},

Thank you for signing the Card Purchase Agreement with Cha Jewels Co., Ltd.
Attached is a PDF copy of the agreement with your signature.

Order: ${orderNum}
Agreement version: ${agreementVersion}

Keep this email for your records. Your card is charged only after our staff confirm your order.

Regards,
Cha Jewels Co., Ltd.`;
  const options = { name: 'Cha Jewels Co., Ltd.', attachments: [pdf] };
  if (SELLER_COPY_EMAIL && /@/.test(SELLER_COPY_EMAIL)) options.bcc = SELLER_COPY_EMAIL;
  try { GmailApp.sendEmail(toEmail, subject, bodyText, options); }
  catch (gmailErr) {
    try { MailApp.sendEmail({ to: toEmail, subject, body: bodyText, name: 'Cha Jewels Co., Ltd.', attachments: [pdf] }); }
    catch (mailAppErr) { throw new Error('Both GmailApp and MailApp failed. GmailApp: ' + gmailErr + ' | MailApp: ' + mailAppErr); }
  }
}

/* ===== PDF (card): the language the customer had on screen when signing.
   English is the agreement; a Japanese PDF carries the governing-text note. ===== */
function cjGenerateCardPdf_({ fullName, email, country, orderId, orderNum, signedAt, cjSigText, signatureBlob, agreement, locale }) {
  const loc = agreement.locales[locale] || agreement.locales.en;
  const docName = `CardPurchaseAgreement_${sanitize_(fullName)}_${sanitize_(orderNum)}_${new Date(signedAt).toISOString().substring(0, 10)}`;
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();
  body.setMarginTop(50).setMarginBottom(40).setMarginLeft(60).setMarginRight(60);
  if (body.getNumChildren() > 0) {
    const f = body.getChild(0);
    if (f.getType() === DocumentApp.ElementType.PARAGRAPH && f.asParagraph().getText() === '') {
      f.asParagraph().setSpacingBefore(0).setSpacingAfter(0); f.asParagraph().editAsText().setFontSize(1);
    }
  }
  try {
    const logoBlob = getLogoBlob_();
    if (logoBlob) {
      const img = body.appendImage(logoBlob.setName('cj_logo.png'));
      img.setWidth(100).setHeight(125);
      styleParagraph_(img.getParent(), { alignment: DocumentApp.HorizontalAlignment.CENTER, spacingBefore: 0, spacingAfter: 6 });
    }
  } catch (e) { Logger.log('Header logo failed: ' + e); }

  addParagraph_(body, (loc.title || 'CARD PURCHASE AGREEMENT').toUpperCase(), {
    font: PDF_FONT_HEADING, size: 18, bold: true, color: PDF_COLOR_BODY, alignment: DocumentApp.HorizontalAlignment.CENTER, spacingBefore: 4, spacingAfter: 2
  });
  addParagraph_(body, loc.parties || '', { font: PDF_FONT_BODY, size: 10, italic: true, color: PDF_COLOR_MUTED, alignment: DocumentApp.HorizontalAlignment.CENTER, spacingAfter: 2 });
  addParagraph_(body, 'Version ' + agreement.version + '  \u2022  Effective ' + agreement.effective_date + '  \u2022  Order ' + orderNum + '  \u2022  ' + locale.toUpperCase(), {
    font: PDF_FONT_BODY, size: 8, color: PDF_COLOR_LIGHT, alignment: DocumentApp.HorizontalAlignment.CENTER, spacingAfter: 10
  });
  addGoldRule_(body);
  if (loc.ui && loc.ui.translation_note) {
    addParagraph_(body, loc.ui.translation_note, { font: PDF_FONT_BODY, size: 9, italic: true, color: PDF_COLOR_MUTED, spacingBefore: 4, spacingAfter: 8 });
  }
  if (loc.preamble) addParagraph_(body, loc.preamble, { font: PDF_FONT_BODY, size: 10, color: PDF_COLOR_BODY, spacingBefore: 4, spacingAfter: 10, lineSpacing: 1.3 });
  (loc.sections || []).forEach(sec => {
    addSectionHeading_(body, sec.heading || '');
    if (sec.intro) addBodyText_(body, sec.intro);
    (sec.body || []).forEach(p => addBodyText_(body, p));
    addItems_(body, sec.items);
  });
  if (loc.notes && (loc.notes.items || []).length) {
    addParagraph_(body, loc.notes.heading || '', { font: PDF_FONT_HEADING, size: 11, bold: true, color: PDF_COLOR_GOLD, spacingBefore: 6, spacingAfter: 4 });
    addItems_(body, loc.notes.items);
  }

  addGoldRule_(body);
  addParagraph_(body, '', { spacingAfter: 6 });
  const table = body.appendTable([['', '']]);
  table.setBorderWidth(0);
  table.getRow(0).getCell(0).setWidth(245); table.getRow(0).getCell(1).setWidth(245);
  const left = table.getCell(0, 0); left.clear(); left.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(0).setPaddingRight(12);
  try { const sigImg = left.appendImage(signatureBlob); sigImg.setWidth(140).setHeight(45); }
  catch (e) { addCellParagraph_(left, '[Signature unavailable]', { size: 9, italic: true, color: PDF_COLOR_MUTED }); }
  addCellParagraph_(left, '─'.repeat(30), { size: 7, color: PDF_COLOR_GOLD, spacingBefore: 2 });
  addCellParagraph_(left, 'Buyer / 購入者: ' + fullName, { size: 10, bold: true, color: PDF_COLOR_BODY });
  addCellParagraph_(left, 'Email: ' + email, { size: 8, color: PDF_COLOR_LIGHT });
  addCellParagraph_(left, 'Country / 居住国: ' + country, { size: 8, color: PDF_COLOR_LIGHT });
  addCellParagraph_(left, 'Order / ご注文: ' + orderNum, { size: 8, color: PDF_COLOR_LIGHT });
  addCellParagraph_(left, 'Order ID: ' + orderId, { size: 7, color: PDF_COLOR_LIGHT });
  addCellParagraph_(left, 'Date / 日付: ' + formatDate_(signedAt) + ' (' + signedAt + ')', { size: 8, color: PDF_COLOR_LIGHT });
  const right = table.getCell(0, 1); right.clear(); right.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(12).setPaddingRight(0);
  addCellParagraph_(right, '', { spacingAfter: 35 });
  addCellParagraph_(right, '─'.repeat(30), { size: 7, color: PDF_COLOR_GOLD, spacingBefore: 2 });
  addCellParagraph_(right, cjSigText, { size: 10, italic: true, color: PDF_COLOR_BODY });
  addCellParagraph_(right, 'Seller / 販売者: Cha Jewels Co., Ltd. 株式会社チャジュエルズ', { size: 10, bold: true, color: PDF_COLOR_BODY });

  addParagraph_(body, '', { spacingAfter: 16 });
  addParagraph_(body, 'This document is a digitally generated copy of the Card Purchase Agreement for order ' + orderNum + ', including the Buyer’s signature and the Seller’s digital signature. Agreement version ' + agreement.version + ', effective ' + agreement.effective_date + '. The English text is the agreement; the Japanese text is a translation.', {
    font: PDF_FONT_BODY, size: 8, italic: true, color: PDF_COLOR_LIGHT, alignment: DocumentApp.HorizontalAlignment.CENTER, spacingAfter: 2
  });
  addParagraph_(body, '© ' + new Date().getFullYear() + ' Cha Jewels Co., Ltd.', { font: PDF_FONT_BODY, size: 7, color: PDF_COLOR_LIGHT, alignment: DocumentApp.HorizontalAlignment.CENTER });

  doc.saveAndClose();
  const pdf = DriveApp.getFileById(doc.getId()).getAs('application/pdf').setName(docName + '.pdf');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return pdf;
}

/** Run once after deploying: renders a test PDF from the live card agreement.
 *  Writes nothing to the sheet and sends no email. */
function cjTestCardRender() {
  const agreement = cjFetchCardAgreement_();
  const sig = Utilities.newBlob(Utilities.base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), 'image/png', 'sig_test.png');
  const pdf = cjGenerateCardPdf_({
    fullName: 'Test Buyer', email: 'test@example.com', country: 'Japan',
    orderId: '00000000-0000-4000-8000-000000000002', orderNum: 'TEST-0002', signedAt: new Date().toISOString(),
    cjSigText: 'Digitally signed by Cha Jewels Co., Ltd.', signatureBlob: sig, agreement, locale: 'ja'
  });
  const file = getOrCreateFolder_(CARD_PDF_FOLDER_NAME).createFile(pdf.setName('TEST_card_render_' + agreement.version + '.pdf'));
  Logger.log('Rendered card version ' + agreement.version + ' -> ' + file.getUrl());
}

/** Creates the two card tabs (headers only) so they are visible before the
 *  first real signature. Safe to run any number of times; never touches rows. */
function cjEnsureCardTabs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureHeadersNonDestructive_(ss, CARD_SHEET_NAME, CARD_HEADERS, {});
  cjEnsureCardLog_(ss);
  Logger.log('Tabs ready: "' + CARD_SHEET_NAME + '" and "' + CARD_LOG_SHEET_NAME + '".');
}

/** Full end-to-end test WITHOUT the web page: runs the same code path as a
 *  real POST from card.html. Writes ONE row to "Card Agreements" (name
 *  "TEST Card Signer", order TEST-CARD-0001, a fixed test order id), then the
 *  trigger renders the PDF, logs it in "Card Signatures" and emails it to the
 *  account running this script. Delete the test row afterwards if you like. */
function cjTestCardSheetWrite() {
  const me = Session.getEffectiveUser().getEmail();
  const out = cjHandleCardPost_({ parameter: {} }, {
    doc: 'card',
    fullName: 'TEST Card Signer',
    email: me,
    country: 'Japan',
    orderNumber: 'TEST-CARD-0001',
    orderId: 'ffffffff-0000-4000-8000-000000000001',
    locale: 'en',
    agreementVersion: cjFetchCardAgreement_().version,
    signedAt: new Date().toISOString(),
    signatureDataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    cjDigitalSig: 'Digitally signed by Cha Jewels Co., Ltd.'
  });
  Logger.log(out.getContent());
  // Process the queue now instead of waiting for the trigger.
  cjProcessCardPdfQueue();
  Logger.log('Done. Check tab "' + CARD_SHEET_NAME + '" (PDF Status), tab "' + CARD_LOG_SHEET_NAME + '" and the inbox of ' + me + '.');
}
