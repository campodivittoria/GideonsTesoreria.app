/* Logica comune del Gestionale Salone.
 * Lo stesso file gira nel browser (modalità prova, dati nel telefono) e sul server (Vercel + MongoDB).
 * Tutte le regole (orari liberi, prenotazioni, ordini, incassi) stanno qui, una volta sola.
 * Gli importi sono sempre in CENTESIMI (2500 = 25,00 €) per evitare errori di arrotondamento.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COLS = ['staff', 'services', 'products', 'clients', 'appointments', 'sales', 'orders'];

  // ---------- utilità ----------
  const pad = n => String(n).padStart(2, '0');
  const toMin = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
  const fromMin = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const weekday = d => new Date(d + 'T12:00:00Z').getUTCDay(); // 0 = domenica
  const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const isTime = t => /^\d{2}:\d{2}$/.test(t || '');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const euro = c => ((c || 0) / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  const normPhone = p => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('0039')) d = d.slice(4); else if (d.startsWith('39') && d.length > 10) d = d.slice(2); return d; };
  const clampStr = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
  const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

  function nowIn(tz) {
    const p = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return { date: `${p.year}-${p.month}-${p.day}`, min: toMin(`${p.hour}:${p.minute}`), time: `${p.hour}:${p.minute}` };
  }
  function code6() {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const g = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(6)) : Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
    let s = ''; for (const b of g) s += a[b % a.length]; return s;
  }
  function fail(msg, status) { const e = new Error(msg); e.status = status || 400; e.userMessage = msg; throw e; }

  // ---------- impostazioni ----------
  function defaultSettings() {
    const day = [['09:00', '13:00'], ['14:30', '19:00']];
    return {
      id: 'main',
      salonName: 'Il tuo salone', tagline: 'Parrucchieri', address: '', phone: '', email: '', tz: 'Europe/Rome',
      hours: { 0: [], 1: [], 2: day, 3: day, 4: day, 5: [['09:00', '19:00']], 6: [['08:30', '18:00']] },
      closures: [],          // giorni di chiusura straordinaria (AAAA-MM-GG)
      slotStep: 15,          // ogni quanti minuti si può iniziare un appuntamento
      minNoticeMin: 60,      // preavviso minimo per prenotare online (minuti)
      daysAhead: 60,         // fino a quanti giorni avanti si prenota online
      cancelHours: 24,       // il cliente può disdire fino a X ore prima
      autoConfirm: true,     // false = ogni prenotazione online va approvata
      payOnline: 'facoltativo', // 'no' | 'facoltativo' | 'obbligatorio'
      depositPercent: 0,     // 0 = si paga tutto; es. 30 = acconto del 30%
      shop: { enabled: true, pickup: true, shipping: true, shippingCost: 690, freeShippingFrom: 5000 },
      rt: { department: '1', operator: '1', payCash: '0', payCard: '2', payPrepaid: '2' }
    };
  }
  function mergeSettings(saved) {
    const d = defaultSettings(); const s = Object.assign({}, d, saved || {});
    s.shop = Object.assign({}, d.shop, (saved && saved.shop) || {});
    s.rt = Object.assign({}, d.rt, (saved && saved.rt) || {});
    s.hours = Object.assign({}, d.hours, (saved && saved.hours) || {});
    return s;
  }

  // Dati iniziali di esempio: operatori, servizi e prodotti (da modificare nelle Impostazioni / Listino)
  function seed(withSampleClients) {
    const staff = [
      { id: 'op1', name: 'Giulia', color: '#c2185b', role: 'Titolare', active: true, online: true },
      { id: 'op2', name: 'Marco', color: '#1565c0', role: 'Stilista', active: true, online: true },
      { id: 'op3', name: 'Sara', color: '#2e7d32', role: 'Colorista', active: true, online: true }
    ];
    const S = (id, name, category, duration, price, extra) => Object.assign({ id, name, category, duration, price, active: true, online: true, requiresApproval: false, staffIds: [], description: '' }, extra || {});
    const services = [
      S('sv1', 'Piega', 'Styling', 30, 1800),
      S('sv2', 'Taglio donna', 'Taglio', 45, 2800),
      S('sv3', 'Taglio uomo', 'Taglio', 30, 1800),
      S('sv4', 'Taglio + piega', 'Taglio', 60, 4000),
      S('sv5', 'Colore', 'Colore', 60, 4500, { staffIds: ['op1', 'op3'] }),
      S('sv6', 'Colpi di sole / balayage', 'Colore', 120, 9000, { staffIds: ['op3'], requiresApproval: true, description: 'Prezzo indicativo: varia con lunghezza e quantità di capelli.' }),
      S('sv7', 'Trattamento ristrutturante', 'Trattamenti', 30, 2500),
      S('sv8', 'Acconciatura sposa / cerimonia', 'Styling', 90, 8000, { staffIds: ['op1'], requiresApproval: true })
    ];
    const P = (id, name, brand, price, stock, extra) => Object.assign({ id, name, brand, price, stock, minStock: 2, use: 'vendita', active: true, online: true, description: '', image: '' }, extra || {});
    const products = [
      P('pr1', 'Shampoo idratante 250 ml', 'Linea Salone', 1590, 12),
      P('pr2', 'Maschera nutriente 200 ml', 'Linea Salone', 2190, 8),
      P('pr3', 'Olio sigillante punte 50 ml', 'Linea Salone', 1890, 5),
      P('pr4', 'Spray termoprotettore 150 ml', 'Linea Salone', 1490, 1),
      P('pr5', 'Buono regalo 50 €', 'Salone', 5000, 999, { minStock: 0, description: 'Da usare per servizi o prodotti in salone.' }),
      P('pr6', 'Ossidante 20 vol. 1 L', 'Professionale', 900, 6, { use: 'interno', online: false })
    ];
    const out = { settings: defaultSettings(), staff, services, products, clients: [], appointments: [], sales: [], orders: [] };
    if (withSampleClients) {
      const today = nowIn('Europe/Rome').date;
      out.clients = [
        { id: 'cl1', name: 'Anna Rossi', phone: '333 111 2233', phoneNorm: '3331112233', email: 'anna@example.com', emailLower: 'anna@example.com', birthday: '', notes: 'Preferisce acqua tiepida', colorFormula: '7.3 + 20 vol, posa 35 min', privacy: true, createdAt: new Date().toISOString(), source: 'salone' },
        { id: 'cl2', name: 'Luca Bianchi', phone: '347 555 6677', phoneNorm: '3475556677', email: '', emailLower: '', birthday: '', notes: '', colorFormula: '', privacy: true, createdAt: new Date().toISOString(), source: 'salone' }
      ];
      const A = (id, staffId, start, sv, client, extra) => Object.assign({
        id, kind: 'appuntamento', date: today, start, duration: sv.duration, staffId, clientId: client.id, clientName: client.name, phone: client.phone, email: client.email,
        items: [{ serviceId: sv.id, name: sv.name, price: sv.price, duration: sv.duration }], total: sv.price, status: 'confermato',
        payment: { status: 'da_pagare', paid: 0 }, source: 'salone', note: '', token: code6(), createdAt: new Date().toISOString()
      }, extra || {});
      out.appointments = [
        A('ap1', 'op1', '09:30', services[4], out.clients[0]),
        A('ap2', 'op2', '10:00', services[2], out.clients[1], { source: 'online', payment: { status: 'pagato', paid: 1800, method: 'online' } }),
        { id: 'ap3', kind: 'blocco', date: today, start: '13:00', duration: 60, staffId: 'op3', note: 'Pausa', status: 'confermato', items: [], total: 0 }
      ];
    }
    return out;
  }

  // ---------- disponibilità ----------
  function staffWindows(settings, member, date) {
    if ((settings.closures || []).includes(date)) return [];
    const src = member.hours || settings.hours || {};
    return (src[weekday(date)] || []).map(([a, b]) => [toMin(a), toMin(b)]);
  }
  function freeStarts(settings, member, appts, date, duration, now) {
    if (date < now.date) return [];
    const step = Number(settings.slotStep) || 15;
    const minStart = date === now.date ? now.min + (Number(settings.minNoticeMin) || 0) : -1;
    const busy = appts.filter(a => a.staffId === member.id && a.date === date && a.status !== 'annullato')
      .map(a => [toMin(a.start), toMin(a.start) + Number(a.duration || 0)]);
    const out = [];
    for (const [o, c] of staffWindows(settings, member, date)) {
      const first = Math.ceil(o / step) * step;
      for (let t = first; t + duration <= c; t += step) {
        if (t < minStart) continue;
        if (busy.some(([s, e]) => t < e && t + duration > s)) continue;
        out.push(t);
      }
    }
    return out;
  }
  // Controllo per il gestionale: l'operatore è libero in quell'orario? (escludendo un appuntamento, quando lo si modifica)
  function overlaps(appts, a) {
    const s = toMin(a.start), e = s + Number(a.duration || 0);
    return appts.filter(x => x.id !== a.id && x.staffId === a.staffId && x.date === a.date && x.status !== 'annullato')
      .filter(x => s < toMin(x.start) + Number(x.duration || 0) && e > toMin(x.start));
  }

  // ---------- funzioni pubbliche (sito clienti) ----------
  async function loadServices(repo, ids) {
    if (!Array.isArray(ids) || !ids.length || ids.length > 6) fail('Scegli da 1 a 6 servizi.');
    const all = await repo.list('services', {});
    const list = ids.map(id => all.find(s => s.id === id && s.active !== false && s.online !== false));
    if (list.some(x => !x)) fail('Uno dei servizi scelti non è più disponibile.');
    return list;
  }
  function eligibleStaff(staff, services) {
    return staff.filter(m => m.active !== false && m.online !== false)
      .filter(m => services.every(s => !s.staffIds || !s.staffIds.length || s.staffIds.includes(m.id)));
  }

  async function catalog(repo) {
    const s = await repo.settings();
    const staff = (await repo.list('staff', {})).filter(x => x.active !== false && x.online !== false)
      .map(({ id, name, color, role }) => ({ id, name, color, role }));
    const services = (await repo.list('services', {})).filter(x => x.active !== false && x.online !== false)
      .map(({ id, name, category, duration, price, description, staffIds, requiresApproval }) => ({ id, name, category, duration, price, description, staffIds: staffIds || [], requiresApproval: !!requiresApproval }));
    const products = s.shop.enabled ? (await repo.list('products', {}))
      .filter(x => x.active !== false && x.online !== false && x.use !== 'interno')
      .map(p => ({ id: p.id, name: p.name, brand: p.brand, price: p.price, description: p.description, image: p.image, stock: Math.max(0, Math.min(p.stock, 20)) })) : [];
    const payments = !!repo.paymentsEnabled;
    return {
      salon: {
        name: s.salonName, tagline: s.tagline, address: s.address, phone: s.phone, email: s.email, hours: s.hours, closures: s.closures,
        daysAhead: s.daysAhead, cancelHours: s.cancelHours, depositPercent: s.depositPercent,
        payOnline: payments ? s.payOnline : 'no', shop: s.shop, today: nowIn(s.tz).date
      },
      staff, services, products, payments
    };
  }

  async function availability(repo, p) {
    const s = await repo.settings(); const now = nowIn(s.tz);
    if (!isDate(p.date)) fail('Data non valida.');
    if (p.date < now.date || p.date > addDays(now.date, Number(s.daysAhead) || 60)) return { date: p.date, slots: [] };
    const services = await loadServices(repo, p.serviceIds);
    const duration = services.reduce((t, x) => t + Number(x.duration), 0);
    let staff = eligibleStaff(await repo.list('staff', {}), services);
    if (p.staffId && p.staffId !== 'any') staff = staff.filter(m => m.id === p.staffId);
    const appts = await repo.list('appointments', { date: p.date });
    const map = new Map();
    for (const m of staff) for (const t of freeStarts(s, m, appts, p.date, duration, now)) if (!map.has(t)) map.set(t, m.id);
    const slots = [...map.entries()].sort((a, b) => a[0] - b[0]).map(([t, staffId]) => ({ time: fromMin(t), staffId }));
    return { date: p.date, duration, slots };
  }

  async function upsertClient(repo, d, source) {
    const ph = normPhone(d.phone); const em = (d.email || '').toLowerCase();
    let c = (await repo.list('clients', { phoneNorm: ph }))[0];
    if (!c && em) c = (await repo.list('clients', { emailLower: em }))[0];
    if (!c) c = { id: uid(), name: d.name, phone: d.phone, phoneNorm: ph, email: d.email || '', emailLower: em, birthday: '', notes: '', colorFormula: '', privacy: !!d.privacy, createdAt: new Date().toISOString(), source };
    else { if (!c.email && em) { c.email = d.email; c.emailLower = em; } if (!c.phone) { c.phone = d.phone; c.phoneNorm = ph; } if (d.privacy) c.privacy = true; }
    await repo.put('clients', c);
    return c;
  }
  function checkPerson(p) {
    const name = clampStr(p.name, 80), phone = clampStr(p.phone, 30), email = clampStr(p.email, 120);
    if (name.length < 2) fail('Scrivi nome e cognome.');
    if (normPhone(phone).length < 6) fail('Scrivi un numero di telefono valido.');
    if (email && !isEmail(email)) fail('L\'indirizzo email non è valido.');
    if (!p.privacy) fail('Serve il consenso al trattamento dei dati per prenotare.');
    return { name, phone, email, privacy: true };
  }
  async function uniqueToken(repo) {
    for (let i = 0; i < 5; i++) { const t = code6(); if (!(await repo.list('appointments', { token: t })).length && !(await repo.list('orders', { token: t })).length) return t; }
    return code6() + code6().slice(0, 2);
  }
  function wantsOnline(s, payments, choice) {
    if (!payments || s.payOnline === 'no') return false;
    return s.payOnline === 'obbligatorio' ? true : !!choice;
  }
  function amountDue(kind, doc, s) {
    const total = doc.total || 0, paid = (doc.payment && doc.payment.paid) || 0;
    if (kind === 'appointment' && Number(s.depositPercent) > 0 && paid === 0) return Math.max(50, Math.round(total * Number(s.depositPercent) / 100));
    return Math.max(0, total - paid);
  }

  async function book(repo, p) {
    const s = await repo.settings();
    const person = checkPerson(p);
    if (!isDate(p.date) || !isTime(p.time)) fail('Scegli giorno e orario.');
    const services = await loadServices(repo, p.serviceIds);
    const av = await availability(repo, { serviceIds: p.serviceIds, staffId: p.staffId, date: p.date });
    const slot = av.slots.find(x => x.time === p.time);
    if (!slot) fail('Questo orario non è più libero: scegline un altro.', 409);
    const staff = await repo.get('staff', slot.staffId);
    const client = await upsertClient(repo, person, 'online');
    const approval = !s.autoConfirm || services.some(x => x.requiresApproval);
    const a = {
      id: uid(), kind: 'appuntamento', date: p.date, start: p.time, duration: av.duration, staffId: slot.staffId,
      clientId: client.id, clientName: person.name, phone: person.phone, email: person.email,
      items: services.map(x => ({ serviceId: x.id, name: x.name, price: x.price, duration: x.duration })),
      total: services.reduce((t, x) => t + x.price, 0),
      status: approval ? 'da_approvare' : 'confermato',
      payment: { status: 'da_pagare', paid: 0 }, source: 'online', note: clampStr(p.note, 500),
      token: await uniqueToken(repo), createdAt: new Date().toISOString()
    };
    await repo.put('appointments', a);
    const online = wantsOnline(s, repo.paymentsEnabled, p.payOnline);
    return { booking: publicAppt(a, staff, s), payNow: online, amountDue: online ? amountDue('appointment', a, s) : 0 };
  }

  function publicAppt(a, staff, s) {
    return {
      kind: 'appointment', code: a.token, date: a.date, start: a.start, duration: a.duration, staffName: staff ? staff.name : '',
      items: a.items.map(i => ({ name: i.name, price: i.price })), total: a.total, status: a.status, payment: a.payment,
      canCancel: canCancel(a, s)
    };
  }
  function publicOrder(o, s) {
    return { kind: 'order', code: o.token, createdAt: o.createdAt, lines: o.lines, shipping: o.shipping, total: o.total, delivery: o.delivery, status: o.status, payment: o.payment };
  }
  function minutesUntil(a, s) {
    const now = nowIn(s.tz); let days = 0, d = now.date;
    if (a.date < d) return -1;
    while (d < a.date && days < 400) { d = addDays(d, 1); days++; }
    return days * 1440 + toMin(a.start) - now.min;
  }
  function canCancel(a, s) {
    return (a.status === 'confermato' || a.status === 'da_approvare') && minutesUntil(a, s) >= (Number(s.cancelHours) || 0) * 60;
  }

  async function lookup(repo, p) {
    const s = await repo.settings(); const code = clampStr(p.code, 12).toUpperCase();
    if (code.length < 6) fail('Scrivi il codice di 6 caratteri che hai ricevuto.');
    const a = (await repo.list('appointments', { token: code }))[0];
    if (a) return publicAppt(a, await repo.get('staff', a.staffId), s);
    const o = (await repo.list('orders', { token: code }))[0];
    if (o) return publicOrder(o, s);
    fail('Nessuna prenotazione o ordine con questo codice.', 404);
  }

  async function cancel(repo, p) {
    const s = await repo.settings(); const code = clampStr(p.code, 12).toUpperCase();
    const a = (await repo.list('appointments', { token: code }))[0];
    if (!a) fail('Prenotazione non trovata.', 404);
    if (!canCancel(a, s)) fail(`La prenotazione non si può più disdire online (serve almeno ${s.cancelHours} ore di preavviso). Chiama il salone.`);
    a.status = 'annullato'; a.cancelledBy = 'cliente'; a.cancelledAt = new Date().toISOString();
    if (a.payment && a.payment.paid > 0) a.payment.refund = 'da_fare';
    await repo.put('appointments', a);
    return publicAppt(a, await repo.get('staff', a.staffId), s);
  }

  async function order(repo, p) {
    const s = await repo.settings();
    if (!s.shop.enabled) fail('Il negozio online non è attivo.');
    const person = checkPerson(p);
    if (!Array.isArray(p.lines) || !p.lines.length || p.lines.length > 30) fail('Il carrello è vuoto.');
    const all = await repo.list('products', {});
    const lines = p.lines.map(l => {
      const pr = all.find(x => x.id === l.productId && x.active !== false && x.online !== false && x.use !== 'interno');
      const qty = Math.floor(Number(l.qty));
      if (!pr) fail('Un prodotto nel carrello non è più disponibile.');
      if (!(qty >= 1 && qty <= 20)) fail('Quantità non valida.');
      if (pr.stock < qty) fail(`Di "${pr.name}" ne sono rimasti solo ${Math.max(0, pr.stock)}.`, 409);
      return { pr, line: { productId: pr.id, name: pr.name, qty, price: pr.price } };
    });
    const delivery = p.delivery === 'spedizione' ? 'spedizione' : 'ritiro';
    if (delivery === 'spedizione' && !s.shop.shipping) fail('La spedizione non è disponibile.');
    if (delivery === 'ritiro' && !s.shop.pickup) fail('Il ritiro in salone non è disponibile.');
    const address = clampStr(p.address, 300);
    if (delivery === 'spedizione' && address.length < 10) fail('Scrivi l\'indirizzo completo per la spedizione.');
    const online = delivery === 'spedizione' ? true : wantsOnline(s, repo.paymentsEnabled, p.payOnline);
    if (online && !repo.paymentsEnabled) fail('Il pagamento online non è ancora attivo: scegli il ritiro in salone.');
    const subtotal = lines.reduce((t, x) => t + x.line.price * x.line.qty, 0);
    const shipping = delivery === 'spedizione' && subtotal < (s.shop.freeShippingFrom || Infinity) ? (s.shop.shippingCost || 0) : 0;
    const client = await upsertClient(repo, person, 'online');
    for (const x of lines) { x.pr.stock -= x.line.qty; await repo.put('products', x.pr); }
    const o = {
      id: uid(), createdAt: new Date().toISOString(), clientId: client.id, clientName: person.name, phone: person.phone, email: person.email,
      lines: lines.map(x => x.line), subtotal, shipping, total: subtotal + shipping, delivery, address, note: clampStr(p.note, 500),
      status: 'nuovo', payment: { status: 'da_pagare', paid: 0 }, token: await uniqueToken(repo)
    };
    await repo.put('orders', o);
    return { order: publicOrder(o, s), payNow: online, amountDue: online ? o.total : 0 };
  }

  // Segna come pagato (dopo Stripe o, in modalità prova, dopo il pagamento simulato)
  async function markPaid(repo, p) {
    const col = p.kind === 'order' ? 'orders' : 'appointments';
    const doc = (await repo.list(col, { token: p.code }))[0] || await repo.get(col, p.id);
    if (!doc) fail('Documento non trovato.', 404);
    if (p.ref && doc.payment && doc.payment.ref === p.ref) return doc; // già registrato
    const paid = ((doc.payment && doc.payment.paid) || 0) + Number(p.amount || 0);
    doc.payment = { status: paid >= doc.total ? 'pagato' : 'acconto', paid, method: 'online', ref: p.ref || '', paidAt: new Date().toISOString() };
    await repo.put(col, doc);
    return doc;
  }

  // ---------- funzioni del gestionale ----------
  // Incasso: registra la vendita, chiude l'appuntamento, scala il magazzino, mette in coda lo scontrino.
  async function sale(repo, p, user) {
    const s = await repo.settings(); const now = nowIn(s.tz);
    if (!Array.isArray(p.lines) || !p.lines.length) fail('Aggiungi almeno un servizio o un prodotto.');
    const lines = p.lines.map(l => ({
      type: l.type === 'prodotto' ? 'prodotto' : 'servizio', refId: clampStr(l.refId, 40), name: clampStr(l.name, 60) || 'Voce',
      qty: Math.max(1, Math.floor(Number(l.qty) || 1)), price: Math.round(Number(l.price) || 0), staffId: clampStr(l.staffId, 40)
    }));
    if (lines.some(l => l.price < 0)) fail('Prezzo non valido.');
    const discount = Math.max(0, Math.round(Number(p.discount) || 0));
    const total = Math.max(0, lines.reduce((t, l) => t + l.price * l.qty, 0) - discount);
    let appt = null, prepaid = 0;
    if (p.appointmentId) { appt = await repo.get('appointments', p.appointmentId); prepaid = appt && appt.payment ? appt.payment.paid || 0 : 0; }
    const method = ['contanti', 'carta', 'misto'].includes(p.method) ? p.method : 'contanti';
    const due = Math.max(0, total - prepaid);
    let cash = 0, card = 0;
    if (method === 'contanti') cash = due; else if (method === 'carta') card = due;
    else { cash = Math.min(due, Math.max(0, Math.round(Number(p.cash) || 0))); card = due - cash; }
    const sl = {
      id: uid(), date: now.date, time: now.time, clientId: p.clientId || (appt && appt.clientId) || '', clientName: clampStr(p.clientName || (appt && appt.clientName), 80),
      appointmentId: appt ? appt.id : '', lines, discount, total, prepaid: Math.min(prepaid, total), due, method, cash, card,
      staffId: p.staffId || (appt && appt.staffId) || '', user: user || '',
      receiptStatus: p.receipt ? 'in_coda' : 'non_richiesto', createdAt: new Date().toISOString()
    };
    await repo.put('sales', sl);
    for (const l of lines.filter(l => l.type === 'prodotto' && l.refId)) {
      const pr = await repo.get('products', l.refId); if (pr) { pr.stock = (pr.stock || 0) - l.qty; await repo.put('products', pr); }
    }
    if (appt) { appt.status = 'completato'; appt.saleId = sl.id; appt.payment = Object.assign({}, appt.payment, { status: 'pagato', paid: total }); await repo.put('appointments', appt); }
    if (sl.clientId) { const c = await repo.get('clients', sl.clientId); if (c) { c.lastVisit = now.date; await repo.put('clients', c); } }
    return sl;
  }

  // Anteprima testuale dello scontrino (quello vero lo stampa il registratore telematico)
  function receiptText(sale, s) {
    const w = 32, L = []; const line = (a, b) => { b = b || ''; L.push(a.slice(0, w - b.length - 1).padEnd(w - b.length) + b); };
    const center = t => L.push(t.slice(0, w).padStart(Math.floor((w + t.length) / 2)).padEnd(w));
    center((s.salonName || '').toUpperCase()); if (s.address) center(s.address);
    center('DOCUMENTO COMMERCIALE'); center('di vendita o prestazione'); L.push('-'.repeat(w));
    for (const l of sale.lines) line((l.qty > 1 ? l.qty + ' x ' : '') + l.name, euro(l.price * l.qty).replace(/\s/g, ' '));
    if (sale.discount) line('Sconto', '-' + euro(sale.discount));
    L.push('-'.repeat(w)); line('TOTALE COMPLESSIVO', euro(sale.total));
    if (sale.prepaid) line('Pagato online', euro(sale.prepaid));
    if (sale.cash) line('Pagamento contante', euro(sale.cash));
    if (sale.card) line('Pagamento elettronico', euro(sale.card));
    line('Operazione senza IVA', ''); line('(regime forfettario)', '');
    L.push('-'.repeat(w)); center(sale.date.split('-').reverse().join('/') + ' ' + sale.time);
    return L.join('\n');
  }

  return {
    COLS, pad, toMin, fromMin, addDays, weekday, isDate, isTime, uid, euro, normPhone, nowIn, code6, fail,
    defaultSettings, mergeSettings, seed, staffWindows, freeStarts, overlaps, canCancel, amountDue, receiptText,
    publicApi: { catalog, availability, book, lookup, cancel, order },
    markPaid, sale
  };
});
