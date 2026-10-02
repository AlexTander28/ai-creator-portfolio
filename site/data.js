const numbered=(kind,names)=>names.map((title,i)=>({id:kind+'-'+String(i+1).padStart(2,'0'),title,category:kind,src:'assets/works/'+kind+'-'+String(i+1).padStart(2,'0')+'.png'}));
const originalUi=[['architecture','Архитектура'],['education','Образование'],['hotel','Отель'],['restaurant','Ресторан'],['shop','Магазин'],['team','Команда'],['training','Тренировки']].map(([key,title])=>({id:'ui-'+key,title,category:'ui',src:'assets/works/ui-'+key+'.png'}));
export const featuredUi=['Финтех-аналитика','Премиальная недвижимость','Путешествия','Креативное агентство','Wellness-панель'].map((title,i)=>({id:'ui-new-'+String(i+1).padStart(2,'0'),title,category:'ui',src:'assets/works/ui-new-'+String(i+1).padStart(2,'0')+'.png'}));
const materialAds=['AURELIA / свет в сыворотке','NOCTA / маршрут из света','CITRA / свежесть в движении','FORMA / ткань в движении','TERRA / ритуал вкуса','SONORA / звук из стекла','PAUSA / тишина в форме'].map((title,i)=>({id:'ad-'+String(i+1).padStart(2,'0'),title,category:'ad',src:'assets/works/ad-'+String(i+1).padStart(2,'0')+'-material.png'}));
export const groups={
cover:numbered('cover',['Сайт за вечер','Кино из текста','Бот берёт рутину','Это не фото','Реклама без студии','Дизайн, который работает','Арсенал креатора']),
ad:materialAds,
ui:[...originalUi,...featuredUi]
};
export const videos=groups.ad.map((item,i)=>({id:'video-'+String(i+1).padStart(2,'0'),title:item.title,category:'video',src:'assets/videos/video-'+String(i+1).padStart(2,'0')+([0,5].includes(i)?'-r1':'')+'.mp4',poster:item.src}));
export const demos=[['leads','Очистка лидов','Проверить контакты и найти дубли'],['support','Обращения','Распределить сообщения по очередям'],['booking','Запись','Выбрать свободное время'],['orders','Заказы','Проверить количество и остатки'],['content','Контент-план','Составить расписание по шаблону'],['invoice','Счёт','Рассчитать позиции, скидку и налог'],['crm','CRM','Провести заявку по этапам']].map(([key,title,description])=>({id:'demo-'+key,category:'automation',title,description,href:'../demos/automation/index.html#'+key}));
export const categoryLabels={cover:'Авторская обложка / концепт',ad:'Рекламный AI-концепт',ui:'UI/UX / концепт интерфейса'};
export const imageWorks=Object.values(groups).flat();
export const works=[...imageWorks,...videos,...demos];
