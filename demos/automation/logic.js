(function(root) {
  'use strict';
  const fail = message => { throw new Error(message); };
  const integer = (value, min, max, label) => {
    const n = Number(value);
    if (String(value).trim() === '' || !Number.isInteger(n) || n < min || n > max) fail(label + ': недопустимое значение');
    return n;
  };
  function leads(text) {
    const seen = new Set(), accepted = [], rejected = [];
    text.split(/\r?\n/).filter(s => s.trim()).forEach((row, i) => {
      const parts = row.split(';');
      const name = (parts[0] || '').trim().replace(/\s+/g, ' ');
      let phone = (parts[1] || '').replace(/\D/g, '');
      if (phone.length === 11 && phone[0] === '8') phone = '7' + phone.slice(1);
      const email = (parts[2] || '').trim().toLowerCase();
      if (parts.length !== 3 || !name || !/^7\d{10}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rejected.push({line:i+1, reason:'Ожидаются имя; российский телефон; email'});
      else if (seen.has(phone) || seen.has(email)) rejected.push({line:i+1,reason:'Дубликат телефона или email'});
      else { seen.add(phone); seen.add(email); accepted.push({name,phone:'+'+phone,email}); }
    });
    return {accepted,rejected};
  }
  function classify(text) {
    if (!text.trim()) fail('Введите обращение');
    const rules = [['Возврат', /возврат|вернуть|отмен/iu],['Оплата', /оплат|плат[её]ж|сч[её]т/iu],['Доставка', /достав|курьер|посыл/iu],['Техническая поддержка', /ошибк|слом|не работает/iu]];
    const matches = rules.filter(([,regex]) => regex.test(text)).map(([name]) => name);
    return {queue:matches[0] || 'Ручной разбор',matches,rule:'Первое совпадение в порядке: возврат → оплата → доставка → поддержка. При отсутствии совпадений — оператор.'};
  }
  const slots = ['09:00','10:00','11:00','14:00','15:00'];
  function book(bookings, slot, name) {
    if (!slots.includes(slot) || !name.trim()) fail('Выберите слот и введите имя');
    if (bookings.some(b => b.slot === slot)) fail('Слот уже занят. Выберите другое время');
    return [...bookings,{slot,name:name.trim()}].sort((a,b) => a.slot.localeCompare(b.slot));
  }
  const products = {notebook:{label:'Блокнот',stock:12,price:450},mug:{label:'Кружка',stock:5,price:790},bag:{label:'Шоппер',stock:3,price:1200}};
  function order(stock, sku, quantity) {
    if (!products[sku]) fail('Неизвестный товар');
    const qty = integer(quantity,1,100,'Количество');
    if (qty > stock[sku]) fail('Недостаточно товара: доступно ' + stock[sku]);
    return {stock:{...stock,[sku]:stock[sku]-qty},total:products[sku].price*qty,quantity:qty,product:products[sku].label};
  }
  function contentPlan(topic, count, start, goal) {
    if (!topic.trim()) fail('Введите тему');
    const n = integer(count,1,14,'Число публикаций');
    const date = new Date(start+'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== start) fail('Некорректная дата');
    const modes = {learn:['Объяснение','Чек-лист','Разбор ошибки'],sell:['Знакомство с продуктом','Сценарий использования','Ответы на вопросы']};
    if (!modes[goal]) fail('Выберите цель');
    return Array.from({length:n},(_,i) => { const d = new Date(date); d.setUTCDate(d.getUTCDate()+i*2); return {date:d.toISOString().slice(0,10),format:modes[goal][i%3],topic:topic.trim(),brief:['Раскройте один конкретный вопрос','Добавьте проверяемый пример','Завершите вопросом читателю'][i%3]}; });
  }
  function invoice(text, discount, vat) {
    const rows = text.split(/\r?\n/).filter(s=>s.trim());
    if (!rows.length) fail('Добавьте позиции счета');
    const lines = rows.map((row,i) => {
      const p = row.split(';');
      if (p.length !== 3 || !p[0].trim()) fail('Строка '+(i+1)+': формат название; количество; цена');
      const quantity = integer(p[1],1,10000,'Количество');
      if (!/^\d+(?:[.,]\d{1,2})?$/.test(p[2].trim())) fail('Цена должна быть положительным числом с максимум двумя знаками');
      const cents = Math.round(Number(p[2].trim().replace(',','.'))*100);
      if (!Number.isSafeInteger(cents) || cents > 100000000) fail('Цена слишком большая');
      return {name:p[0].trim(),quantity,cents,totalCents:quantity*cents};
    });
    const pct = integer(discount,0,100,'Скидка');
    const rate = integer(vat,0,30,'Налог');
    const subtotalCents = lines.reduce((s,l)=>s+l.totalCents,0);
    if (!Number.isSafeInteger(subtotalCents)) fail('Сумма слишком большая');
    const discountCents = Math.round(subtotalCents*pct/100);
    const taxCents = Math.round((subtotalCents-discountCents)*rate/100);
    return {lines,subtotalCents,discountCents,taxCents,totalCents:subtotalCents-discountCents+taxCents};
  }
  const transitions = {new:['qualified','lost'],qualified:['proposal','lost'],proposal:['won','lost'],won:[],lost:[]};
  const statuses = {new:'Новая',qualified:'Квалифицирована',proposal:'Предложение',won:'Выиграна',lost:'Закрыта без сделки'};
  function route(current,next,hasContact,amount) {
    if (!transitions[current]?.includes(next)) fail('Этот переход недоступен');
    if (next === 'qualified' && !hasContact) fail('Для квалификации нужен подтверждённый контакт');
    if (['proposal','won'].includes(next) && !(Number(amount)>0 && Number(amount)<=100000000)) fail('Укажите положительный бюджет до 100 000 000');
    return {status:next,owner:next==='new'?'Очередь':next==='qualified'?'Менеджер':next==='proposal'?'Продажи':'Архив'};
  }
  const api = {leads,classify,slots,book,products,order,contentPlan,invoice,transitions,statuses,route};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Automation = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
