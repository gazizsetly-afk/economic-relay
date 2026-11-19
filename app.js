'use strict';
// Economic Relay v5 front end: students, personal teacher accounts and the supervisor.
const S = {
  brandSmall: ['ЭКОНОМИЧЕСКАЯ', 'ЭКОНОМИКАЛЫҚ'], brandBig: ['ЭСТАФЕТА', 'ЭСТАФЕТА'],
  footer: ['✦ Экономикалық эстафета · Экономическая эстафета', '✦ Экономикалық эстафета · Экономическая эстафета'],
  supervisorLink: ['Вход руководителя', 'Басшының кіруі'],
  logout: ['Выйти', 'Шығу'], loading: ['Загрузка…', 'Жүктелуде…'],
  heroKicker: ['✦ КОМАНДНАЯ ИГРА ПО ЭКОНОМИКЕ', '✦ ЭКОНОМИКА БОЙЫНША КОМАНДАЛЫҚ ОЙЫН'],
  heroTitle: ['Вместе думаем.<br><span>Вместе побеждаем.</span>', 'Бірге ойлаймыз.<br><span>Бірге жеңеміз.</span>'],
  heroText: ['Преподаватель проходит тест и открывает своим студентам командные задания на казахском и русском языках. Студенты решают кейс в три этапа и защищают его перед жюри.', 'Мұғалім тест тапсырып, өз студенттеріне қазақ және орыс тілдеріндегі командалық тапсырмаларды ашады. Студенттер кейсті үш кезеңде шешіп, қазылар алдында қорғайды.'],
  factQ: ['вопросов в тесте', 'тест сұрағы'], factCases: ['командных кейсов', 'командалық кейс'], factPts: ['баллов за кейс', 'кейске балл'],
  studentCard: ['Я студент', 'Мен студентпін'], studentCardText: ['Введите 6-значный код класса, который дал преподаватель, или отсканируйте QR-код.', 'Мұғалім берген 6 таңбалы сынып кодын енгізіңіз немесе QR-кодты сканерлеңіз.'],
  classCode: ['Код класса', 'Сынып коды'], continue: ['Продолжить', 'Жалғастыру'],
  teacherCard: ['Я преподаватель', 'Мен мұғаліммін'], teacherCardText: ['Личный кабинет: тест из 20 вопросов, ваши команды, коды и оценки. Заходите в любое время.', 'Жеке кабинет: 20 сұрақтық тест, командаларыңыз, кодтар мен бағалар. Кез келген уақытта кіріңіз.'],
  signIn: ['Войти', 'Кіру'], register: ['Регистрация', 'Тіркелу'], createAccount: ['Создать аккаунт', 'Аккаунт ашу'],
  fullName: ['ФИО', 'Аты-жөні'], login: ['Логин', 'Логин'], loginHint: ['латиница, цифры, . _ - @ (3–40 символов)', 'латын әріптері, сандар, . _ - @ (3–40 таңба)'],
  password: ['Пароль', 'Құпиясөз'], passwordHint: ['не короче 6 символов', 'кемі 6 таңба'], regCode: ['Код регистрации (от руководителя)', 'Тіркелу коды (басшыдан)'],
  teacherLogin: ['Вход преподавателя', 'Мұғалімнің кіруі'], noAccount: ['Нет аккаунта? Зарегистрируйтесь', 'Аккаунт жоқ па? Тіркеліңіз'], haveAccount: ['Уже есть аккаунт? Войти', 'Аккаунт бар ма? Кіру'],
  supervisorLogin: ['Вход руководителя', 'Басшының кіруі'], supervisorText: ['Руководитель видит всех преподавателей, их тесты, классы и оценки.', 'Басшы барлық мұғалімді, олардың тестін, сыныптары мен бағаларын көреді.'],
  close: ['Закрыть', 'Жабу'], cancel: ['Отмена', 'Болдырмау'], save: ['Сохранить', 'Сақтау'], saved: ['Сохранено ✓', 'Сақталды ✓'], back: ['Назад', 'Артқа'], next: ['Далее', 'Келесі'],
  // student
  classOf: ['Класс преподавателя', 'Мұғалімнің сыныбы'], waitTitle: ['Задания ещё закрыты', 'Тапсырмалар әлі жабық'], waitText: ['Преподаватель откроет задания после теста. Страница обновится сама.', 'Мұғалім тесттен кейін тапсырмаларды ашады. Бет өзі жаңарады.'],
  closedTitle: ['Приём ответов завершён', 'Жауап қабылдау аяқталды'], joinTitle: ['Вход в команду', 'Командаға кіру'],
  yourName: ['Ваше имя и фамилия', 'Аты-жөніңіз'], team: ['Команда', 'Команда'], teamPin: ['PIN-код команды', 'Команда PIN-коды'], join: ['Войти в команду', 'Командаға кіру'],
  joinHelp: ['Первый вошедший становится капитаном — только он отправляет общий ответ.', 'Бірінші кірген капитан болады — ортақ жауапты тек ол жібереді.'],
  otherCode: ['Другой код', 'Басқа код'], captain: ['Капитан', 'Капитан'], member: ['Участник', 'Қатысушы'], members: ['Участники', 'Қатысушылар'],
  yourCase: ['Кейс вашей команды', 'Командаңыздың кейсі'], stage: ['Этап', 'Кезең'],
  answerStage: ['Ответ: этап', 'Жауап: кезең'], photoOpt: ['Фото письменной работы или плаката (необязательно, JPG/PNG/WebP до 2,7 МБ)', 'Жазбаша жұмыстың немесе плакаттың фотосы (міндетті емес, JPG/PNG/WebP, 2,7 МБ дейін)'],
  submit: ['Отправить ответ команды', 'Команда жауабын жіберу'], submitConfirm: ['Отправить? Изменить ответ потом нельзя.', 'Жіберу керек пе? Кейін өзгертуге болмайды.'],
  captainNote: ['Вы капитан: заполните ответы по трём этапам и отправьте один общий ответ.', 'Сіз капитансыз: үш кезеңнің жауабын толтырып, бір ортақ жауап жіберіңіз.'],
  memberNote: ['Обсуждайте решение вместе — ответ отправляет капитан.', 'Шешімді бірге талқылаңыз — жауапты капитан жібереді.'],
  submittedTitle: ['Ответ отправлен', 'Жауап жіберілді'], submittedText: ['Готовьтесь к устной защите с плакатом А3 (до 4 минут).', 'А3 плакатымен ауызша қорғауға дайындалыңыз (4 минутқа дейін).'],
  yourAnswer: ['Ваш ответ', 'Сіздің жауабыңыз'], photoAttached: ['Фото прикреплено', 'Фото тіркелді'], openPhoto: ['Открыть фото', 'Фотоны ашу'],
  result: ['Оценка жюри', 'Қазылар бағасы'], waitingGrade: ['Ожидает оценки', 'Бағалауды күтуде'], feedback: ['Комментарий', 'Пікір'],
  rules: ['Правила и защита', 'Ережелер және қорғау'], poster: ['Плакат А3', 'А3 плакат'],
  ranking: ['Рейтинг команд', 'Командалар рейтингі'], rankingEmpty: ['Баллы появятся после проверки.', 'Ұпайлар тексерілгеннен кейін шығады.'], points: ['баллов', 'балл'],
  answerOrPhoto: ['Заполните хотя бы один этап или прикрепите фото.', 'Кемі бір кезеңді толтырыңыз немесе фото тіркеңіз.'],
  // teacher
  hello: ['Здравствуйте', 'Сәлеметсіз бе'], tabHome: ['Главная', 'Басты'], tabTest: ['Тест', 'Тест'], tabTeams: ['Команды', 'Командалар'], tabGrade: ['Оценки', 'Бағалау'], tabProfile: ['Профиль', 'Профиль'],
  lesson: ['Занятие', 'Сабақ'], phase_setup: ['Подготовка', 'Дайындық'], phase_open: ['Задания открыты', 'Тапсырмалар ашық'], phase_closed: ['Приём закрыт', 'Қабылдау жабық'],
  step1: ['Пройдите тест', 'Тест тапсырыңыз'], step1t: ['20 вопросов по экономике и финансовой грамотности. Без теста задания не откроются.', 'Экономика және қаржылық сауаттылық бойынша 20 сұрақ. Тестсіз тапсырмалар ашылмайды.'],
  step2: ['Подготовьте команды', 'Командаларды дайындаңыз'], step2t: ['Выберите 7 или 10 команд и раздайте студентам PIN-коды.', '7 немесе 10 команданы таңдап, студенттерге PIN-кодтарды беріңіз.'],
  step3: ['Откройте задания', 'Тапсырмаларды ашыңыз'], step3t: ['Студенты входят по коду класса или QR, выбирают команду и вводят PIN.', 'Студенттер сынып коды не QR арқылы кіріп, команданы таңдап, PIN енгізеді.'],
  step4: ['Оцените команды', 'Командаларды бағалаңыз'], step4t: ['50 баллов: этапы 10 + 15 + 15 и устная защита 10.', '50 балл: кезеңдер 10 + 15 + 15 және ауызша қорғау 10.'],
  takeTest: ['Пройти тест', 'Тест тапсыру'], testDone: ['Тест пройден', 'Тест тапсырылды'], openTasks: ['Открыть задания студентам', 'Студенттерге тапсырма ашу'], closeTasks: ['Закрыть приём ответов', 'Жауап қабылдауды жабу'], reopen: ['Открыть снова', 'Қайта ашу'],
  goTeams: ['Открыть команды', 'Командаларды ашу'], goGrade: ['К оценкам', 'Бағалауға өту'],
  yourClass: ['Код вашего класса', 'Сыныбыңыздың коды'], classHelp: ['Покажите студентам код или QR. Ссылка ведёт сразу в ваш класс.', 'Студенттерге кодты немесе QR көрсетіңіз. Сілтеме бірден сыныбыңызға апарады.'], copyLink: ['Скопировать ссылку', 'Сілтемені көшіру'],
  statStudents: ['студентов', 'студент'], statSubmitted: ['ответов', 'жауап'], statGraded: ['оценено', 'бағаланды'], statTeams: ['команд', 'команда'],
  testTitle: ['Тест для преподавателей колледжа по основам экономики и финансовой грамотности', 'Колледж оқытушыларына арналған экономика негіздері және қаржылық сауаттылық бойынша тест'],
  testDesc: ['Один правильный ответ из пяти. 1 балл за верный ответ, максимум — 20. Тест проходится один раз за занятие.', 'Бес нұсқаның біреуі дұрыс. Әр дұрыс жауап — 1 балл, барлығы — 20. Тест әр сабаққа бір рет тапсырылады.'],
  question: ['Вопрос', 'Сұрақ'], finishTest: ['Завершить тест', 'Тестті аяқтау'], chooseAnswer: ['Выберите ответ.', 'Жауапты таңдаңыз.'], answerAll: ['Ответьте на все вопросы.', 'Барлық сұраққа жауап беріңіз.'],
  testResult: ['Результат теста', 'Тест нәтижесі'], level: ['Уровень', 'Деңгей'], lv_high: ['Высокий уровень', 'Жоғары деңгей'], lv_good: ['Хороший уровень', 'Жақсы деңгей'], lv_basic: ['Базовый уровень', 'Базалық деңгей'], lv_repeat: ['Требуется повторение материала', 'Материалды қайталау қажет'],
  correctAnswer: ['Правильный ответ', 'Дұрыс жауап'], yourChoice: ['Ваш ответ', 'Сіздің жауабыңыз'], sec1: ['Основы экономики', 'Экономика негіздері'], sec2: ['Финансовая грамотность', 'Қаржылық сауаттылық'], sec3: ['Практика и рынок', 'Тәжірибе және нарық'],
  teamCount: ['Количество команд', 'Командалар саны'], teamCountHelp: ['Можно менять, пока задания не открыты и в командах никого нет.', 'Тапсырмалар ашылмай, командаларда ешкім болмаса ғана өзгертуге болады.'], apply: ['Применить', 'Қолдану'],
  teamName: ['Название', 'Атауы'], pin: ['PIN', 'PIN'], newPin: ['Новый PIN', 'Жаңа PIN'], makeCaptain: ['Сделать капитаном', 'Капитан ету'], remove: ['Удалить', 'Өшіру'], noMembers: ['Пока никого нет', 'Әзірге ешкім жоқ'],
  printPins: ['Распечатать PIN-коды', 'PIN-кодтарды басып шығару'],
  gradeTitle: ['Ответы команд и оценка жюри', 'Команда жауаптары және қазылар бағасы'], noAnswer: ['Ответа пока нет', 'Әзірге жауап жоқ'], judgeKey: ['Образец ответа для жюри', 'Қазыларға арналған үлгі жауап'],
  r_analysis: ['Этап 1 · анализ', '1-кезең · талдау'], r_calculation: ['Этап 2 · расчёт', '2-кезең · есептеу'], r_decision: ['Этап 3 · решение', '3-кезең · шешім'], r_defense: ['Устная защита и плакат', 'Ауызша қорғау және плакат'],
  saveGrade: ['Сохранить оценку', 'Бағаны сақтау'], rubricFill: ['Заполните все четыре оценки в пределах максимума.', 'Төрт бағаны да шегінде толтырыңыз.'], total: ['Итого', 'Барлығы'],
  changePassword: ['Сменить пароль', 'Құпиясөзді ауыстыру'], oldPassword: ['Текущий пароль', 'Қазіргі құпиясөз'], newPassword: ['Новый пароль', 'Жаңа құпиясөз'],
  export: ['Экспорт результатов', 'Нәтижелерді жүктеу'], downloadCsv: ['Скачать Excel / CSV', 'Excel / CSV жүктеу'],
  newRound: ['Новое занятие', 'Жаңа сабақ'], newRoundText: ['Результаты текущего занятия сохранятся в истории, команды очистятся, а тест нужно будет пройти снова.', 'Ағымдағы сабақ нәтижелері тарихқа сақталады, командалар тазартылады, тестті қайта тапсыру керек.'],
  newRoundConfirm: ['Начать новое занятие? Студенты текущего занятия будут отключены.', 'Жаңа сабақ бастау керек пе? Ағымдағы студенттер шығарылады.'],
  history: ['История занятий', 'Сабақтар тарихы'], historyEmpty: ['Завершённых занятий пока нет.', 'Аяқталған сабақ әзірге жоқ.'], account: ['Аккаунт', 'Аккаунт'],
  // supervisor
  supTitle: ['Кабинет руководителя', 'Басшы кабинеті'], supSub: ['Все преподаватели, их тесты, классы и результаты студентов.', 'Барлық мұғалімдер, олардың тесті, сыныптары және студент нәтижелері.'],
  tabTeachers: ['Преподаватели', 'Мұғалімдер'], tabSettings: ['Настройки', 'Баптаулар'],
  sTeachers: ['преподавателей', 'мұғалім'], sPassed: ['прошли тест', 'тест тапсырды'], sAvg: ['средний балл теста', 'тесттің орташа балы'], sOpen: ['классов открыто', 'сынып ашық'], sStudents: ['студентов сейчас', 'қазір студент'],
  search: ['Поиск по ФИО или логину', 'Аты-жөні не логин бойынша іздеу'], noTeachers: ['Преподаватели ещё не зарегистрировались. Отправьте им ссылку на сайт.', 'Мұғалімдер әлі тіркелмеген. Оларға сайт сілтемесін жіберіңіз.'],
  colTeacher: ['Преподаватель', 'Мұғалім'], colTest: ['Тест', 'Тест'], colClass: ['Класс', 'Сынып'], colTeams: ['Команды', 'Командалар'], colLast: ['Последний вход', 'Соңғы кіру'],
  notTaken: ['не пройден', 'тапсырылмаған'], blocked: ['заблокирован', 'бұғатталған'], details: ['Подробнее', 'Толығырақ'],
  resetPassword: ['Сбросить пароль', 'Құпиясөзді қалпына келтіру'], resetPrompt: ['Новый пароль для преподавателя (не короче 6 символов):', 'Мұғалімге жаңа құпиясөз (кемі 6 таңба):'], block: ['Заблокировать', 'Бұғаттау'], unblock: ['Разблокировать', 'Бұғаттан шығару'],
  deleteTeacher: ['Удалить аккаунт', 'Аккаунтты өшіру'], deleteConfirm: ['Удалить аккаунт и все его данные? Это нельзя отменить.', 'Аккаунтты және оның барлық деректерін өшіру керек пе? Қайтару мүмкін емес.'],
  attempts: ['Попытки теста', 'Тест әрекеттері'], registered: ['Зарегистрирован', 'Тіркелген'],
  regTitle: ['Регистрация преподавателей', 'Мұғалімдерді тіркеу'], regHelp: ['Если задать код, зарегистрироваться смогут только те, кому вы его сообщили. Пусто — регистрация открыта для всех.', 'Код қойсаңыз, тек кодты білетіндер тіркеле алады. Бос болса — тіркелу барлығына ашық.'],
  createTitle: ['Создать аккаунт преподавателю', 'Мұғалімге аккаунт ашу'], createHelp: ['Можно завести аккаунт самому и передать логин и пароль преподавателю.', 'Аккаунтты өзіңіз ашып, логин мен құпиясөзді мұғалімге беруге болады.'],
  keysTitle: ['Образцы ответов жюри', 'Қазылардың үлгі жауаптары'], keysHelp: ['Загрузите приватный JSON-файл с ответами. Его увидят только преподаватели в разделе оценок. Не выкладывайте файл в GitHub.', 'Жауаптары бар жеке JSON файлды жүктеңіз. Оны тек мұғалімдер бағалау бөлімінде көреді. Файлды GitHub-қа салмаңыз.'],
  keysLoaded: ['Загружено для кейсов', 'Жүктелген кейстер'], importFile: ['Загрузить файл', 'Файлды жүктеу'],
  exportTitle: ['Отчёт по преподавателям', 'Мұғалімдер бойынша есеп'], legacyTitle: ['Данные прошлой версии сайта', 'Сайттың алдыңғы нұсқасының деректері'], legacyHelp: ['Результаты старого общего кабинета сохранены. Можно скачать резервную копию.', 'Ескі ортақ кабинеттің нәтижелері сақталған. Резервтік көшірмені жүктеуге болады.'], legacyDownload: ['Скачать резервную копию', 'Резервтік көшірмені жүктеу'],
  // errors
  errDefault: ['Не удалось выполнить действие.', 'Әрекет орындалмады.'], err_network: ['Нет связи с сервером.', 'Сервермен байланыс жоқ.'],
  err_incorrect_password: ['Неверный пароль.', 'Құпиясөз қате.'], err_incorrect_login: ['Неверный логин или пароль.', 'Логин немесе құпиясөз қате.'], err_account_blocked: ['Аккаунт заблокирован руководителем.', 'Аккаунтты басшы бұғаттаған.'],
  err_not_authorized: ['Войдите в систему.', 'Жүйеге кіріңіз.'], err_session_expired: ['Сессия истекла. Войдите снова.', 'Сессия аяқталды. Қайта кіріңіз.'],
  err_login_taken: ['Такой логин уже занят.', 'Бұл логин бос емес.'], err_login_format: ['Логин: латиница, цифры, . _ - @ (3–40 символов).', 'Логин: латын әріптері, сандар, . _ - @ (3–40 таңба).'],
  err_password_too_short: ['Пароль — минимум 6 символов.', 'Құпиясөз кемі 6 таңба.'], err_name_required: ['Введите имя полностью.', 'Аты-жөніңізді толық енгізіңіз.'], err_invalid_reg_code: ['Неверный код регистрации.', 'Тіркелу коды қате.'],
  err_class_not_found: ['Класс с таким кодом не найден.', 'Мұндай кодпен сынып табылмады.'], err_not_open: ['Задания ещё не открыты.', 'Тапсырмалар әлі ашылмаған.'], err_invalid_team_code: ['Неверный PIN команды.', 'Команда PIN-коды қате.'],
  err_name_taken: ['Это имя уже есть в команде.', 'Бұл есім командада бар.'], err_captain_only: ['Отправить ответ может только капитан.', 'Жауапты тек капитан жібере алады.'], err_already_submitted: ['Ответ уже отправлен.', 'Жауап жіберіліп қойған.'],
  err_empty_answer: ['Ответ пустой.', 'Жауап бос.'], err_image_too_large: ['Фото слишком большое (до 2,7 МБ, JPG/PNG/WebP).', 'Фото тым үлкен (2,7 МБ дейін, JPG/PNG/WebP).'], err_invalid_image: ['Неподдерживаемый формат фото.', 'Фото форматы қолдау көрмейді.'],
  err_quiz_first: ['Сначала пройдите тест.', 'Алдымен тест тапсырыңыз.'], err_quiz_already_done: ['Тест уже пройден в этом занятии.', 'Бұл сабақта тест тапсырылған.'], err_answer_all: ['Ответьте на все вопросы.', 'Барлық сұраққа жауап беріңіз.'],
  err_setup_only: ['Можно только до открытия заданий.', 'Тек тапсырма ашылғанға дейін.'], err_existing_responses: ['В командах уже есть студенты.', 'Командаларда студенттер бар.'], err_rubric_range: ['Проверьте баллы по критериям.', 'Критерий ұпайларын тексеріңіз.'],
  err_team_duplicate: ['Такое название уже есть.', 'Мұндай атау бар.'], err_try_later: ['Слишком много попыток. Подождите несколько минут.', 'Әрекет тым көп. Бірнеше минут күтіңіз.'],
  err_invalid_answer_key: ['Неверный файл ответов (нужны 10 кейсов на двух языках).', 'Жауап файлы қате (екі тілде 10 кейс болуы керек).'], err_code_too_short: ['Код — минимум 4 символа.', 'Код кемі 4 таңба.'],
};
let lang = 'ru';
try { if (localStorage.getItem('economic-relay.lang') === 'kk') lang = 'kk'; } catch {}
const L = k => (S[k] ? S[k][lang === 'kk' ? 1 : 0] : k);
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTERS = ['А', 'Б', 'В', 'Г', 'Д'];
const RUBRIC = [['analysis', 10], ['calculation', 15], ['decision', 15], ['defense', 10]];
const fmtDate = v => v ? new Date(v).toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

let session = null, data = null, classInfo = null, tab = 'home', lastView = '', quiz = { index: 0, answers: {} }, detail = null, search = '', loginMode = 'login';

function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3800); }
function errText(code) { return S['err_' + code] ? L('err_' + code) : L('errDefault'); }
async function api(url, method = 'GET', body) {
  let res;
  try { res = await fetch('/api' + url, { method, credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw Error('network'); }
  let out; try { out = await res.json(); } catch { throw Error('network'); }
  if (!res.ok) throw Error(out.error || 'network');
  return out;
}
async function act(url, body, okMsg = L('saved')) {
  try { const r = await api(url, 'POST', body); await load(); if (okMsg) toast(okMsg); return r; }
  catch (e) { toast(errText(e.message)); if (e.message === 'session_expired' || e.message === 'not_authorized') await load(); return null; }
}
function setLang(code) { lang = code; try { localStorage.setItem('economic-relay.lang', code); } catch {} render(true); }
function urlCode() { const c = new URLSearchParams(location.search).get('c'); return /^\d{6}$/.test(c || '') ? c : ''; }
function setUrlCode(code) { const u = new URL(location.href); if (code) u.searchParams.set('c', code); else u.searchParams.delete('c'); history.replaceState(null, '', u); }

let quizKey = '';
async function load(quiet) {
  try {
    const before = quiet ? JSON.stringify([session, data, classInfo, detail]) : '';
    const ses = await api('/session');
    let d = null, c = null, det = detail;
    if (ses.role === 'teacher') d = await api('/teacher');
    else if (ses.role === 'supervisor') { d = await api('/supervisor'); if (detail) det = await api('/supervisor/teacher/' + detail.id).catch(() => null); }
    else if (ses.role === 'student') d = await api('/student');
    else if (classInfo?.code || urlCode()) c = await api('/class/' + (classInfo?.code || urlCode())).catch(e => ({ error: e.message, code: urlCode() }));
    session = ses; data = d; classInfo = c; detail = ses.role === 'supervisor' ? det : null;
    if (ses.role === 'teacher' && !d.quiz && quizKey !== d.id + ':' + d.round) { quizKey = d.id + ':' + d.round; restoreQuiz(); }
    if (quiet && before === JSON.stringify([session, data, classInfo, detail])) return;
    render();
  } catch (e) {
    if (quiet) return; $('app').innerHTML = `<div class="card reveal"><p class="note bad">${esc(errText(e.message))}</p><button class="btn" onclick="load()">↻</button></div>`; }
}

// ---------- shell ----------
function header() {
  document.documentElement.lang = lang;
  $('brandSmall').textContent = L('brandSmall'); $('brandBig').textContent = L('brandBig');
  $('footerText').textContent = L('footer'); $('supervisorLink').textContent = L('supervisorLink');
  $('supervisorLink').classList.toggle('hidden', !!session?.role);
  $('langRu').classList.toggle('active', lang === 'ru'); $('langKk').classList.toggle('active', lang === 'kk');
  $('signout').textContent = '↪ ' + L('logout'); $('signout').classList.toggle('hidden', !session?.role);
  document.body.dataset.role = session?.role || 'guest';
}
function render(force) {
  header();
  if (!session) return;
  const view = (session.role || (classInfo ? 'class' : 'landing')) + ':' + (session.role === 'supervisor' ? (detail ? 'detail' : tab) : tab);
  const html = session.role === 'teacher' ? teacherUI() : session.role === 'supervisor' ? supervisorUI() : session.role === 'student' ? studentUI() : classInfo ? classUI() : landingUI();
  const app = $('app'), opened = {};
  app.querySelectorAll('details[data-k]').forEach(el => opened[el.dataset.k] = el.open);
  app.innerHTML = html;
  if (view === lastView) app.querySelectorAll('details[data-k]').forEach(el => { if (el.dataset.k in opened) el.open = opened[el.dataset.k]; });
  if (view !== lastView || force) { app.classList.remove('animate'); void app.offsetWidth; app.classList.add('animate'); }
  lastView = view;
}
const card = (title, body, cls = '') => `<section class="card reveal ${cls}">${title ? `<h2>${title}</h2>` : ''}${body}</section>`;
const field = (label, id, attrs = '', hint = '') => `<label class="field"><span>${label}</span><input class="input" id="${id}" ${attrs}>${hint ? `<small>${hint}</small>` : ''}</label>`;
const pill = (text, cls = '') => `<span class="pill ${cls}">${text}</span>`;
const phasePill = ph => pill(L('phase_' + ph), ph === 'open' ? 'green' : ph === 'closed' ? 'gray' : 'amber');

// ---------- landing ----------
function landingUI() {
  return `<section class="hero reveal">
    <span class="kicker">${L('heroKicker')}</span>
    <h1>${L('heroTitle')}</h1>
    <p>${L('heroText')}</p>
    <div class="facts"><div><b data-count="20">20</b><span>${L('factQ')}</span></div><div><b data-count="10">10</b><span>${L('factCases')}</span></div><div><b data-count="50">50</b><span>${L('factPts')}</span></div></div>
  </section>
  <div class="roles">
    <section class="card role reveal">
      <div class="role-icon">🎓</div><h2>${L('studentCard')}</h2><p class="muted">${L('studentCardText')}</p>
      <form onsubmit="goClass(event)" class="row-form">${field(L('classCode'), 'codeInput', 'inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="off" placeholder="123456"')}<button class="btn primary" type="submit">${L('continue')} →</button></form>
    </section>
    <section class="card role reveal">
      <div class="role-icon violet">👩‍🏫</div><h2>${L('teacherCard')}</h2><p class="muted">${L('teacherCardText')}</p>
      <div class="btn-row"><button class="btn primary" onclick="openTeacherDialog('login')">${L('signIn')}</button><button class="btn ghost" onclick="openTeacherDialog('register')">${L('register')}</button></div>
    </section>
  </div>`;
}
async function goClass(e) {
  e.preventDefault(); const code = $('codeInput').value.trim();
  if (!/^\d{6}$/.test(code)) { toast(errText('class_not_found')); return; }
  try { classInfo = await api('/class/' + code); setUrlCode(code); render(); } catch (ex) { toast(errText(ex.message)); }
}
function dialog(html) { $('dialogBody').innerHTML = `<button class="dialog-x" type="button" onclick="closeDialog()" aria-label="${L('close')}">×</button>` + html; if (!$('dialog').open) $('dialog').showModal(); }
function closeDialog() { $('dialog').close(); }
function openTeacherDialog(mode) {
  loginMode = mode;
  const reg = mode === 'register';
  dialog(`<div class="dialog-icon">👩‍🏫</div><h2>${reg ? L('register') : L('teacherLogin')}</h2>
  <form onsubmit="teacherAuth(event)">
    ${reg ? field(L('fullName'), 'tName', 'required minlength="3" maxlength="120" autocomplete="name"') : ''}
    ${field(L('login'), 'tLogin', 'required minlength="3" maxlength="40" autocomplete="username" autocapitalize="none" spellcheck="false"', reg ? L('loginHint') : '')}
    ${field(L('password'), 'tPass', `type="password" required minlength="${reg ? 6 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"`, reg ? L('passwordHint') : '')}
    ${reg && session?.regCodeRequired ? field(L('regCode'), 'tReg', 'required autocomplete="off"') : ''}
    <button class="btn primary full" type="submit">${reg ? L('createAccount') : L('signIn')} →</button>
  </form>
  <button class="link-btn center" type="button" onclick="openTeacherDialog('${reg ? 'login' : 'register'}')">${reg ? L('haveAccount') : L('noAccount')}</button>`);
  setTimeout(() => $(reg ? 'tName' : 'tLogin')?.focus(), 50);
}
async function teacherAuth(e) {
  e.preventDefault();
  const body = { login: $('tLogin').value.trim(), password: $('tPass').value };
  try {
    if (loginMode === 'register') await api('/teacher/register', 'POST', { ...body, name: $('tName').value.trim(), regCode: $('tReg')?.value.trim() || '' });
    else await api('/teacher/login', 'POST', body);
    closeDialog(); tab = 'home'; setUrlCode(''); await load();
  } catch (ex) { toast(errText(ex.message)); }
}
function openSupervisorDialog() {
  dialog(`<div class="dialog-icon gold">🏛️</div><h2>${L('supervisorLogin')}</h2><p class="muted">${L('supervisorText')}</p>
  <form onsubmit="supervisorAuth(event)">${field(L('password'), 'sPass', 'type="password" required autocomplete="current-password"')}<button class="btn primary full" type="submit">${L('signIn')} →</button></form>`);
  setTimeout(() => $('sPass')?.focus(), 50);
}
async function supervisorAuth(e) {
  e.preventDefault();
  try { await api('/supervisor/login', 'POST', { password: $('sPass').value }); closeDialog(); tab = 'teachers'; detail = null; await load(); }
  catch (ex) { toast(errText(ex.message)); }
}

// ---------- student: class entry ----------
function classUI() {
  const c = classInfo;
  if (c.error) return card('', `<p class="note bad">${errText(c.error)}</p><button class="btn ghost" onclick="leaveClass()">← ${L('otherCode')}</button>`, 'narrow');
  let body;
  if (c.phase === 'open') {
    body = `<form onsubmit="joinTeam(event)">
      ${field(L('yourName'), 'jName', 'required minlength="2" maxlength="90" autocomplete="name"')}
      <label class="field"><span>${L('team')}</span><select class="input" id="jTeam" required><option value="">—</option>${c.teams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      ${field(L('teamPin'), 'jPin', 'inputmode="numeric" required maxlength="10" autocomplete="off"')}
      <p class="muted small">★ ${L('joinHelp')}</p>
      <button class="btn primary full" type="submit">${L('join')} →</button></form>`;
  } else {
    body = `<div class="wait"><div class="pulse-ring">${c.phase === 'closed' ? '🏁' : '⏳'}</div><h3>${c.phase === 'closed' ? L('closedTitle') : L('waitTitle')}</h3>${c.phase === 'setup' ? `<p class="muted">${L('waitText')}</p>` : ''}</div>`;
  }
  return `<div class="split">${card(`<span class="muted small block">${L('classOf')} · ${esc(c.code)}</span>👩‍🏫 ${esc(c.teacher)}`, `${phasePill(c.phase)}<h3 class="mt">${L('joinTitle')}</h3>${body}<button class="link-btn" type="button" onclick="leaveClass()">← ${L('otherCode')}</button>`, 'narrow')}${c.phase !== 'setup' ? rankingCard(c.leaderboard) : ''}</div>`;
}
function leaveClass() { classInfo = null; setUrlCode(''); render(); }
async function joinTeam(e) {
  e.preventDefault();
  try { await api('/student/join', 'POST', { code: classInfo.code, name: $('jName').value.trim(), teamId: Number($('jTeam').value), pin: $('jPin').value.trim() }); await load(); }
  catch (ex) { toast(errText(ex.message)); }
}
function rankingCard(list) {
  const rows = (list || []).map((t, i) => `<div class="rank-row ${t.score != null && i < 3 ? 'top' + (i + 1) : ''}"><span class="rank-pos">${t.score != null ? (['🥇', '🥈', '🥉'][i] || i + 1) : '·'}</span><span class="rank-name">${esc(t.name)}<small>${t.members} 👤 ${t.submitted ? '· ✓' : ''}</small></span><b>${t.score ?? '—'}<small>/50</small></b></div>`).join('');
  return card('🏆 ' + L('ranking'), (list || []).some(t => t.score != null) ? rows : `<p class="muted">${L('rankingEmpty')}</p>${rows}`, 'ranking');
}

// ---------- student: team work ----------
function caseStages(content) {
  return `<div class="stages">${content.stages.map((s, i) => `<article class="stage s${i + 1}"><div class="stage-num">${i + 1}</div><div><h4>${esc(s.heading)}</h4><p>${esc(s.body)}</p></div></article>`).join('')}</div>`;
}
function rulesBlock(ins) {
  const x = ins?.[lang] || ins?.ru; if (!x) return '';
  return `<details class="rules" data-k="rules"><summary>📋 ${L('rules')}</summary><p>${esc(x.intro)}</p><ul>${(x.oral || []).map(o => `<li>${esc(o.replace(/^[-\s]+/, ''))}</li>`).join('')}</ul><p><b>🖼 ${L('poster')}:</b> ${esc(x.poster)}</p></details>`;
}
function gradeBlock(sub) {
  if (!sub || sub.score == null) return `<p class="note">⏳ ${L('waitingGrade')}</p>`;
  return `<div class="grade-box"><div class="score-big">${sub.score}<small>/50</small></div><div class="grade-parts">${RUBRIC.map(([k, m]) => `<div><span>${L('r_' + k)}</span><b>${sub.rubric?.[k] ?? '—'}/${m}</b></div>`).join('')}</div>${sub.feedback ? `<p class="feedback">💬 ${esc(sub.feedback)}</p>` : ''}</div>`;
}
function studentUI() {
  const d = data, team = d.team, me = d.me, c = team.case?.[lang] || team.case?.ru, sub = team.submission;
  let work;
  if (sub) {
    work = `<div class="done-banner"><span>✅</span><div><h3>${L('submittedTitle')}</h3><p>${L('submittedText')}</p></div></div>
      <h3 class="mt">${L('yourAnswer')}</h3>${sub.answers.map((a, i) => a ? `<div class="answer"><b>${L('stage')} ${i + 1}</b><p>${esc(a)}</p></div>` : '').join('')}
      ${sub.hasPhoto ? `<a class="btn ghost small" target="_blank" rel="noopener" href="/api/photo/${d.tid}/${team.id}">📷 ${L('openPhoto')}</a>` : ''}
      <h3 class="mt">${L('result')}</h3>${gradeBlock(sub)}`;
  } else if (d.phase !== 'open') {
    work = `<p class="note">${d.phase === 'closed' ? L('closedTitle') : L('waitText')}</p>`;
  } else if (me.isCaptain) {
    work = `<p class="note good">★ ${L('captainNote')}</p>
      ${[0, 1, 2].map(i => `<label class="field"><span>${L('answerStage')} ${i + 1}${c?.stages[i] ? ' · ' + esc(c.stages[i].heading.replace(/^[^.]*\.\s*/, '')) : ''}</span><textarea class="input" id="ans${i}" rows="5" maxlength="5000"></textarea></label>`).join('')}
      <label class="field"><span>${L('photoOpt')}</span><input class="input" id="ansPhoto" type="file" accept="image/jpeg,image/png,image/webp"></label>
      <button class="btn primary full" id="sendBtn" onclick="submitAnswer()">📨 ${L('submit')}</button>`;
  } else {
    work = `<p class="note">👥 ${L('memberNote')}</p>`;
  }
  return `<div class="page-head reveal"><div><span class="muted small block">👩‍🏫 ${esc(d.teacher)} · ${esc(d.classCode)}</span><h1>🏳️ ${esc(team.name)}</h1><p class="muted">${me.isCaptain ? '★ ' + L('captain') : L('member')} · ${esc(me.name)}</p></div>${phasePill(d.phase)}</div>
  <div class="split wide">
    <div>
      ${card('📚 ' + L('yourCase') + (c ? `<span class="case-title">${esc(c.title)}</span>` : ''), (c ? caseStages(c) : '') + rulesBlock(d.instructions))}
      ${card('✍️ ' + L('yourAnswer'), work)}
    </div>
    <div>
      ${card('👥 ' + L('members'), `<ul class="member-list">${team.members.map(m => `<li>${m.isCaptain ? '★' : '•'} ${esc(m.name)}</li>`).join('')}</ul>`)}
      ${rankingCard(d.leaderboard)}
    </div>
  </div>`;
}
async function submitAnswer() {
  const answers = [0, 1, 2].map(i => $('ans' + i).value.trim()), file = $('ansPhoto').files[0];
  if (!answers.some(Boolean) && !file) { toast(L('answerOrPhoto')); return; }
  if (file && (file.size > 2700000 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { toast(errText('image_too_large')); return; }
  if (!confirm(L('submitConfirm'))) return;
  let photo = null;
  if (file) photo = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(file); });
  $('sendBtn').disabled = true;
  try { await api('/student/submit', 'POST', { answers, photo }); await load(); confetti(); toast(L('saved')); }
  catch (ex) { $('sendBtn').disabled = false; toast(errText(ex.message)); }
}

// ---------- teacher ----------
function teacherUI() {
  const d = data;
  const tabs = [['home', '⌂', L('tabHome')], ['test', '🧠', L('tabTest')], ['teams', '👥', L('tabTeams')], ['grade', '✎', L('tabGrade')], ['profile', '⚙', L('tabProfile')]];
  if (!tabs.some(t => t[0] === tab)) tab = 'home';
  const body = tab === 'test' ? testUI() : tab === 'teams' ? teamsUI() : tab === 'grade' ? gradeUI() : tab === 'profile' ? profileUI() : teacherHome();
  return `<div class="page-head reveal"><div><span class="muted small block">${L('hello')},</span><h1>👩‍🏫 ${esc(d.name)}</h1><p class="muted">${L('lesson')} ${d.round} · ${L('classCode')} <b>${esc(d.classCode)}</b></p></div>${phasePill(d.phase)}</div>
  <nav class="tabs reveal">${tabs.map(([id, ic, label]) => `<button type="button" class="${tab === id ? 'on' : ''}" onclick="go('${id}')"><span>${ic}</span>${label}</button>`).join('')}</nav>${body}`;
}
function go(next) { tab = next; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function teacherHome() {
  const d = data, students = d.teams.reduce((n, t) => n + t.members.length, 0), sub = d.teams.filter(t => t.submission).length, graded = d.teams.filter(t => t.submission?.score != null).length;
  const steps = [
    [d.quiz ? 'done' : 'now', L('step1'), L('step1t'), d.quiz ? `${pill('✓ ' + L('testDone') + ': ' + d.quiz.score + '/20', 'green')}` : `<button class="btn primary small" onclick="go('test')">🧠 ${L('takeTest')}</button>`],
    [d.phase !== 'setup' ? 'done' : d.quiz ? 'now' : '', L('step2'), L('step2t'), `<button class="btn ghost small" onclick="go('teams')">👥 ${L('goTeams')} (${d.teams.length})</button>`],
    [d.phase === 'open' ? 'now' : d.phase === 'closed' ? 'done' : '', L('step3'), L('step3t'), d.phase === 'open' ? `<button class="btn soft-red small" onclick="closeTasks()">◼ ${L('closeTasks')}</button>` : `<button class="btn green small" ${d.quiz ? '' : 'disabled'} onclick="openTasks()">🔓 ${d.phase === 'closed' ? L('reopen') : L('openTasks')}</button>`],
    [graded && graded === sub && sub ? 'done' : sub ? 'now' : '', L('step4'), L('step4t'), `<button class="btn ghost small" ${sub ? '' : 'disabled'} onclick="go('grade')">✎ ${L('goGrade')} (${graded}/${sub})</button>`],
  ];
  const link = location.origin + '/?c=' + d.classCode;
  return `<div class="tiles reveal"><div class="tile"><b>${d.teams.length}</b><span>${L('statTeams')}</span></div><div class="tile"><b>${students}</b><span>${L('statStudents')}</span></div><div class="tile"><b>${sub}</b><span>${L('statSubmitted')}</span></div><div class="tile"><b>${graded}</b><span>${L('statGraded')}</span></div></div>
  <div class="split wide">
    ${card('', `<ol class="steps">${steps.map(([st, t, txt, btn], i) => `<li class="${st}"><span class="dot">${st === 'done' ? '✓' : i + 1}</span><div><h3>${t}</h3><p class="muted">${txt}</p>${btn}</div></li>`).join('')}</ol>`)}
    ${card('🔗 ' + L('yourClass'), `<div class="class-code">${esc(d.classCode).replace(/(\d{3})(\d{3})/, '$1 $2')}</div><img class="qr" src="/api/qr?c=${esc(d.classCode)}" alt="QR" width="200" height="200"><p class="muted small">${L('classHelp')}</p><div class="linkbox">${esc(link)}</div><button class="btn ghost small" onclick="copyText('${esc(link)}')">⧉ ${L('copyLink')}</button>`, 'center-card')}
  </div>
  ${d.phase !== 'setup' ? rankingCard(d.leaderboard) : ''}`;
}
async function openTasks() { if (!confirm(L('openTasks') + '?')) return; await act('/teacher/open', {}); }
async function closeTasks() { if (!confirm(L('closeTasks') + '?')) return; await act('/teacher/close', {}); }
function copyText(t) { (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => toast(L('saved'))).catch(() => prompt('URL', t)); }

function testUI() {
  const d = data, qs = d.questions;
  if (d.quiz) {
    return card('', `<div class="result-head"><div><h2>🎉 ${L('testResult')}</h2><p class="muted">${fmtDate(d.quiz.finishedAt)}</p></div><div class="score-ring" style="--p:${d.quiz.score / 20 * 100}"><b>${d.quiz.score}</b><small>/20</small></div></div>
      <p class="note good"><b>${L('level')}:</b> ${L('lv_' + d.quiz.level)}</p>
      ${qs.map((q, i) => { const mine = d.quiz.answers[i], ok = mine === q.correct; return `<details class="qa ${ok ? 'ok' : 'no'}"><summary>${ok ? '✅' : '❌'} ${i + 1}. ${esc(q[lang])}</summary><p><b>${L('correctAnswer')}:</b> ${LETTERS[q.correct]}) ${esc(q['options_' + lang][q.correct])}</p>${ok ? '' : `<p class="muted">${L('yourChoice')}: ${LETTERS[mine]}) ${esc(q['options_' + lang][mine])}</p>`}</details>`; }).join('')}`);
  }
  const i = quiz.index, q = qs[i], n = qs.length, answered = Object.keys(quiz.answers).length;
  return `<section class="card quiz reveal"><div class="quiz-top"><span class="pill">${L('question')} ${i + 1}/${n}</span><span class="muted small">${answered}/${n} ✓</span></div>
    <h2 class="quiz-title">🧠 ${L('testTitle')}</h2><p class="muted small">${L('testDesc')}</p>
    <div class="bar"><span style="width:${(i + 1) / n * 100}%"></span></div>
    <span class="section-tag">${L(i < 7 ? 'sec1' : i < 14 ? 'sec2' : 'sec3')}</span>
    <h3 class="q-text">${i + 1}. ${esc(q[lang])}</h3>
    <div class="options">${q['options_' + lang].map((o, k) => `<label class="option ${quiz.answers[i] === k ? 'picked' : ''}" style="--d:${k * 60}ms"><input type="radio" name="qopt" ${quiz.answers[i] === k ? 'checked' : ''} onchange="pick(${k})"><span class="letter">${LETTERS[k]}</span><span>${esc(o)}</span></label>`).join('')}</div>
    <div class="quiz-nav"><button class="btn ghost" ${i === 0 ? 'disabled' : ''} onclick="qMove(-1)">← ${L('back')}</button><button class="btn primary" onclick="qMove(1)">${i === n - 1 ? L('finishTest') + ' ✓' : L('next') + ' →'}</button></div>
    <div class="dots">${qs.map((_, k) => `<button type="button" class="${k === i ? 'cur' : ''} ${Number.isInteger(quiz.answers[k]) ? 'ans' : ''}" onclick="qJump(${k})" aria-label="${k + 1}"></button>`).join('')}</div></section>`;
}
function saveQuiz() { try { localStorage.setItem('economic-relay.quiz.' + data.id + '.' + data.round, JSON.stringify(quiz)); } catch {} }
function restoreQuiz() { try { const s = JSON.parse(localStorage.getItem('economic-relay.quiz.' + data.id + '.' + data.round) || 'null'); if (s && typeof s.answers === 'object') quiz = s; else quiz = { index: 0, answers: {} }; } catch { quiz = { index: 0, answers: {} }; } }
function pick(k) { quiz.answers[quiz.index] = k; saveQuiz(); document.querySelectorAll('.option').forEach((el, j) => el.classList.toggle('picked', j === k)); const dots = document.querySelectorAll('.dots button'); dots[quiz.index]?.classList.add('ans'); }
function qJump(k) { quiz.index = k; saveQuiz(); render(); }
function qMove(delta) {
  const n = data.questions.length;
  if (delta > 0 && !Number.isInteger(quiz.answers[quiz.index])) { toast(L('chooseAnswer')); return; }
  if (delta > 0 && quiz.index === n - 1) return finishQuiz();
  quiz.index = Math.max(0, Math.min(n - 1, quiz.index + delta)); saveQuiz(); render();
}
async function finishQuiz() {
  const n = data.questions.length, answers = Array.from({ length: n }, (_, i) => quiz.answers[i]);
  const miss = answers.findIndex(x => !Number.isInteger(x));
  if (miss >= 0) { quiz.index = miss; render(); toast(L('answerAll')); return; }
  if (!confirm(L('finishTest') + '?')) return;
  const r = await act('/teacher/quiz', { answers }, null);
  if (r) { try { localStorage.removeItem('economic-relay.quiz.' + data.id + '.' + (data.round)); } catch {} confetti(); }
}

function teamsUI() {
  const d = data, locked = d.phase !== 'setup' || d.teams.some(t => t.members.length);
  return `${card('⚙ ' + L('teamCount'), `<p class="muted">${L('teamCountHelp')}</p><div class="seg">${[7, 10].map(n => `<button type="button" class="${d.teams.length === n ? 'on' : ''}" ${locked ? 'disabled' : ''} onclick="setCount(${n})">${n}</button>`).join('')}</div><button class="btn ghost small mt" onclick="printPins()">🖨 ${L('printPins')}</button>`)}
  <div class="team-grid">${d.teams.map(t => { const c = t.case?.[lang] || t.case?.ru; return `<section class="card team reveal">
    <div class="team-head"><span class="team-no">${t.id}</span><input class="input bare" value="${esc(t.name)}" maxlength="60" onchange="renameTeam(${t.id}, this.value)" aria-label="${L('teamName')}"></div>
    <p class="muted small">📚 ${esc(c?.title || '')}</p>
    <div class="pin-row"><span>${L('pin')}</span><b class="pin">${esc(t.pin)}</b><button class="btn ghost tiny" onclick="newPin(${t.id})">↻ ${L('newPin')}</button></div>
    <h4>${L('members')} (${t.members.length})</h4>
    ${t.members.length ? `<ul class="member-list">${t.members.map(m => `<li>${m.isCaptain ? '★' : '•'} ${esc(m.name)} <span class="row-actions">${m.isCaptain ? '' : `<button class="link-btn" onclick="memberAct(${t.id},${m.id},'captain')">${L('makeCaptain')}</button>`}<button class="link-btn red" onclick="memberAct(${t.id},${m.id},'remove')">${L('remove')}</button></span></li>`).join('')}</ul>` : `<p class="muted small">${L('noMembers')}</p>`}
    ${t.submission ? pill('✓ ' + L('statSubmitted'), 'green') : ''}
  </section>`; }).join('')}</div>`;
}
async function setCount(n) { await act('/teacher/teams', { count: n }); }
async function renameTeam(id, name) { await act('/teacher/team', { teamId: id, name }); }
async function newPin(id) { if (!confirm(L('newPin') + '?')) return; await act('/teacher/team', { teamId: id, newPin: true }); }
async function memberAct(teamId, memberId, action) { if (!confirm((action === 'remove' ? L('remove') : L('makeCaptain')) + '?')) return; await act('/teacher/member', { teamId, memberId, action }); }
function printPins() {
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(`<!doctype html><meta charset="utf-8"><title>PIN</title><style>body{font-family:system-ui,sans-serif;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px}div{border:2px dashed #555;border-radius:12px;padding:18px}h2{margin:0 0 6px}b{font-size:30px;letter-spacing:4px}</style>${data.teams.map(t => `<div><h2>${esc(t.name)}</h2><p>${L('classCode')}: <b>${esc(data.classCode)}</b></p><p>${L('pin')}: <b>${esc(t.pin)}</b></p><small>${esc(location.origin)}</small></div>`).join('')}<script>print()<\/script>`);
  w.document.close();
}

function gradeUI() {
  const d = data;
  return `<div class="section-head reveal"><h2>✎ ${L('gradeTitle')}</h2><a class="btn ghost small" href="/api/teacher/csv" download>↓ ${L('downloadCsv')}</a></div>
  ${d.teams.map((t, idx) => teamReview(t, idx, d, true)).join('')}`;
}
function teamReview(t, idx, d, editable) {
  const c = t.case?.[lang] || t.case?.ru, sub = t.submission, key = d.answerKeys?.[t.officialId]?.[lang];
  const photoUrl = `/api/photo/${d.id}/${t.id}`;
  return `<details class="card review reveal" data-k="rev${t.id}" ${idx === 0 && sub ? 'open' : ''}><summary><span class="team-no">${t.id}</span><span class="grow">${esc(t.name)}<small>${esc(c?.title || '')}</small></span>${sub ? (sub.score != null ? pill(sub.score + '/50', 'green') : pill(L('waitingGrade'), 'amber')) : pill(L('noAnswer'), 'gray')}</summary>
    <p class="muted small">👥 ${t.members.map(m => (m.isCaptain ? '★ ' : '') + esc(m.name)).join(', ') || '—'}</p>
    ${sub ? `${c ? c.stages.map((s, i) => `<div class="answer"><b>${esc(s.heading)}</b><p>${esc(sub.answers[i] || '—')}</p>${key ? `<details class="key"><summary>🔐 ${L('judgeKey')}</summary><p>${esc(key[i])}</p></details>` : ''}</div>`).join('') : ''}
      ${sub.hasPhoto ? `<a class="btn ghost small" target="_blank" rel="noopener" href="${photoUrl}">📷 ${L('openPhoto')}</a>` : ''}
      ${editable ? `<div class="rubric">${RUBRIC.map(([k, m]) => `<label class="field"><span>${L('r_' + k)} <em>0–${m}</em></span><input class="input" type="number" min="0" max="${m}" step="1" id="r_${k}_${t.id}" value="${sub.rubric?.[k] ?? ''}" oninput="sumRubric(${t.id})"></label>`).join('')}<div class="rubric-total">${L('total')}: <b id="sum_${t.id}">${sub.score ?? '—'}</b>/50</div></div>
        <label class="field"><span>${L('feedback')}</span><textarea class="input" id="fb_${t.id}" rows="2" maxlength="1500">${esc(sub.feedback || '')}</textarea></label>
        <button class="btn green" onclick="saveGrade(${t.id})">✓ ${L('saveGrade')}</button>` : gradeBlock(sub)}` : `<p class="muted">${L('noAnswer')}</p>`}
  </details>`;
}
function sumRubric(id) { let s = 0, ok = true; for (const [k] of RUBRIC) { const v = $(`r_${k}_${id}`).value; if (v === '') ok = false; s += Number(v) || 0; } $('sum_' + id).textContent = ok ? s : '—'; }
async function saveGrade(id) {
  const rubric = {};
  for (const [k, m] of RUBRIC) { const el = $(`r_${k}_${id}`), v = Number(el.value); if (el.value === '' || !Number.isInteger(v) || v < 0 || v > m) { toast(L('rubricFill')); el.focus(); return; } rubric[k] = v; }
  await act('/teacher/grade', { teamId: id, rubric, feedback: $('fb_' + id).value });
}

function profileUI() {
  const d = data;
  return `<div class="split">
    ${card('👤 ' + L('account'), `<p><b>${esc(d.name)}</b><br><span class="muted">${L('login')}: ${esc(d.login)}</span></p>
      <h3>${L('changePassword')}</h3><form onsubmit="changePass(event)">${field(L('oldPassword'), 'pOld', 'type="password" required autocomplete="current-password"')}${field(L('newPassword'), 'pNew', 'type="password" required minlength="6" autocomplete="new-password"', L('passwordHint'))}<button class="btn primary" type="submit">${L('save')}</button></form>`)}
    ${card('📦 ' + L('export'), `<a class="btn ghost" href="/api/teacher/csv" download>↓ ${L('downloadCsv')}</a><h3 class="mt">↻ ${L('newRound')}</h3><p class="muted">${L('newRoundText')}</p><button class="btn soft-red" onclick="newRound()">${L('newRound')}</button>`)}
  </div>
  ${card('🗂 ' + L('history'), d.history.length ? d.history.map(h => `<details class="qa"><summary>${L('lesson')} ${h.round} · ${fmtDate(h.finishedAt)} · 🧠 ${h.quizScore ?? '—'}/20</summary>${h.teams.map(t => `<p>${esc(t.name)}: <b>${t.score ?? '—'}</b>/50 <span class="muted small">${t.members.map(esc).join(', ')}</span></p>`).join('')}</details>`).join('') : `<p class="muted">${L('historyEmpty')}</p>`)}`;
}
async function changePass(e) { e.preventDefault(); const r = await act('/teacher/password', { old: $('pOld').value, next: $('pNew').value }); if (r) e.target.reset(); }
async function newRound() { if (!confirm(L('newRoundConfirm'))) return; const r = await act('/teacher/new-round', { confirm: 'NEW ROUND' }); if (r) { quiz = { index: 0, answers: {} }; tab = 'home'; render(); } }

// ---------- supervisor ----------
function supervisorUI() {
  const tabs = [['teachers', '👩‍🏫', L('tabTeachers')], ['settings', '⚙', L('tabSettings')]];
  if (!tabs.some(t => t[0] === tab)) tab = 'teachers';
  return `<div class="page-head reveal"><div><span class="muted small block">🏛️</span><h1>${L('supTitle')}</h1><p class="muted">${L('supSub')}</p></div></div>
  ${detail ? '' : `<nav class="tabs reveal">${tabs.map(([id, ic, label]) => `<button type="button" class="${tab === id ? 'on' : ''}" onclick="go('${id}')"><span>${ic}</span>${label}</button>`).join('')}</nav>`}
  ${detail ? teacherDetailUI() : tab === 'settings' ? supSettingsUI() : supTeachersUI()}`;
}
function supTeachersUI() {
  const list = data.teachers, passed = list.filter(t => t.lastAttempt), avg = passed.length ? (passed.reduce((a, t) => a + t.lastAttempt.score, 0) / passed.length).toFixed(1) : '—';
  const q = search.trim().toLowerCase(), shown = q ? list.filter(t => t.name.toLowerCase().includes(q) || t.login.includes(q)) : list;
  return `<div class="tiles reveal"><div class="tile"><b>${list.length}</b><span>${L('sTeachers')}</span></div><div class="tile"><b>${passed.length}</b><span>${L('sPassed')}</span></div><div class="tile"><b>${avg}</b><span>${L('sAvg')}</span></div><div class="tile"><b>${list.filter(t => t.phase === 'open').length}</b><span>${L('sOpen')}</span></div><div class="tile"><b>${list.reduce((n, t) => n + t.students, 0)}</b><span>${L('sStudents')}</span></div></div>
  <section class="card reveal"><div class="section-head"><input class="input search" id="searchBox" placeholder="🔎 ${L('search')}" value="${esc(search)}" oninput="search=this.value;filterTeachers()"><a class="btn ghost small" href="/api/supervisor/csv" download>↓ ${L('downloadCsv')}</a></div>
  ${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>${L('colTeacher')}</th><th>${L('colTest')}</th><th>${L('colClass')}</th><th>${L('colTeams')}</th><th>${L('colLast')}</th><th></th></tr></thead><tbody id="teacherRows">${teacherRows(shown)}</tbody></table></div>` : `<p class="muted">${L('noTeachers')}</p>`}</section>`;
}
function teacherRows(rows) {
  return rows.map(t => `<tr onclick="openTeacher(${t.id})"><td><b>${esc(t.name)}</b><small>${esc(t.login)}${t.blocked ? ' · ⛔ ' + L('blocked') : ''}</small></td>
    <td>${t.lastAttempt ? `<b>${t.lastAttempt.score}</b>/20<small>${L('lv_' + t.lastAttempt.level)}</small>` : `<span class="muted">${L('notTaken')}</span>`}</td>
    <td>${phasePill(t.phase)}<small>${esc(t.classCode)} · ${L('lesson')} ${t.round}</small></td>
    <td>${t.students} 👤 · ${t.submitted}/${t.teams} ✓<small>${t.avgTeamScore != null ? '⌀ ' + t.avgTeamScore + '/50' : ''}</small></td>
    <td><small>${fmtDate(t.lastLoginAt)}</small></td><td><button class="btn ghost tiny">${L('details')} →</button></td></tr>`).join('');
}
function filterTeachers() { const q = search.trim().toLowerCase(); const el = $('teacherRows'); if (el) el.innerHTML = teacherRows(data.teachers.filter(t => t.name.toLowerCase().includes(q) || t.login.includes(q))); }
async function openTeacher(id) { try { detail = await api('/supervisor/teacher/' + id); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { toast(errText(e.message)); } }
function teacherDetailUI() {
  const d = detail;
  return `<button class="btn ghost small reveal" onclick="detail=null;render()">← ${L('back')}</button>
  <div class="split wide mt">
    ${card(`👩‍🏫 ${esc(d.name)}`, `<p class="muted">${L('login')}: <b>${esc(d.login)}</b> · ${L('registered')}: ${fmtDate(d.createdAt)}<br>${L('colLast')}: ${fmtDate(d.lastLoginAt)}</p>
      <p>${phasePill(d.phase)} ${pill(L('classCode') + ' ' + esc(d.classCode))} ${pill(L('lesson') + ' ' + d.round)} ${d.blocked ? pill('⛔ ' + L('blocked'), 'red') : ''}</p>
      <div class="btn-row"><button class="btn ghost small" onclick="supAct('reset')">🔑 ${L('resetPassword')}</button><button class="btn ghost small" onclick="supAct('${d.blocked ? 'unblock' : 'block'}')">${d.blocked ? '✓ ' + L('unblock') : '⛔ ' + L('block')}</button><button class="btn soft-red small" onclick="supAct('delete')">🗑 ${L('deleteTeacher')}</button></div>`)}
    ${card('🧠 ' + L('attempts'), d.attempts.length ? `<ul class="attempts">${d.attempts.map(a => `<li><b>${a.score}/${a.total}</b> <span>${L('lv_' + a.level)}</span><small>${L('lesson')} ${a.round} · ${fmtDate(a.finishedAt)}</small></li>`).join('')}</ul>` : `<p class="muted">${L('notTaken')}</p>`)}
  </div>
  ${d.phase !== 'setup' || d.teams.some(t => t.submission) ? rankingCard(d.leaderboard) : ''}
  <div class="section-head reveal"><h2>✎ ${L('gradeTitle')}</h2></div>
  ${d.teams.map((t, i) => teamReview(t, i, d, false)).join('')}
  ${d.history.length ? card('🗂 ' + L('history'), d.history.map(h => `<details class="qa"><summary>${L('lesson')} ${h.round} · ${fmtDate(h.finishedAt)} · 🧠 ${h.quizScore ?? '—'}/20</summary>${h.teams.map(t => `<p>${esc(t.name)}: <b>${t.score ?? '—'}</b>/50 <span class="muted small">${t.members.map(esc).join(', ')}</span></p>`).join('')}</details>`).join('')) : ''}`;
}
async function supAct(action) {
  const body = { id: detail.id, action };
  if (action === 'reset') { const p = prompt(L('resetPrompt')); if (!p) return; if (p.length < 6) { toast(errText('password_too_short')); return; } body.password = p; }
  if (action === 'delete') { if (!confirm(L('deleteConfirm'))) return; body.confirm = 'DELETE'; }
  if (action === 'block' && !confirm(L('block') + '?')) return;
  const r = await act('/supervisor/teacher', body);
  if (r && action === 'delete') { detail = null; render(); }
}
function supSettingsUI() {
  const d = data;
  return `<div class="split">
    ${card('🔐 ' + L('regTitle'), `<p class="muted">${L('regHelp')}</p><div class="row-form">${field(L('regCode'), 'regCodeIn', `value="${esc(d.regCode)}" maxlength="60" autocomplete="off"`)}<button class="btn primary" onclick="act('/supervisor/settings',{regCode:$('regCodeIn').value.trim()})">${L('save')}</button></div>`)}
    ${card('➕ ' + L('createTitle'), `<p class="muted">${L('createHelp')}</p><form onsubmit="createTeacher(event)">${field(L('fullName'), 'cName', 'required minlength="3" maxlength="120"')}${field(L('login'), 'cLogin', 'required minlength="3" maxlength="40" autocapitalize="none" spellcheck="false"', L('loginHint'))}${field(L('password'), 'cPass', 'required minlength="6" autocomplete="new-password"', L('passwordHint'))}<button class="btn primary" type="submit">${L('createAccount')}</button></form>`)}
    ${card('🗝 ' + L('keysTitle'), `<p class="muted">${L('keysHelp')}</p><p>${pill(L('keysLoaded') + ': ' + d.answerKeyCount + '/10', d.answerKeyCount ? 'green' : 'amber')}</p><label class="btn ghost small file-btn">📂 ${L('importFile')}<input type="file" accept="application/json,.json" onchange="importKeys(this)"></label>`)}
    ${card('📊 ' + L('exportTitle'), `<a class="btn ghost" href="/api/supervisor/csv" download>↓ ${L('downloadCsv')}</a>${d.hasLegacy ? `<h3 class="mt">${L('legacyTitle')}</h3><p class="muted">${L('legacyHelp')}</p><a class="btn ghost small" href="/api/supervisor/legacy-export" download>↓ ${L('legacyDownload')}</a>${d.legacyAttempts.length ? `<ul class="attempts">${d.legacyAttempts.map(a => `<li><b>${a.score}/${a.total}</b> ${esc(a.name)}<small>${fmtDate(a.finishedAt)}</small></li>`).join('')}</ul>` : ''}` : ''}`)}
  </div>`;
}
async function createTeacher(e) { e.preventDefault(); const r = await act('/supervisor/create-teacher', { name: $('cName').value.trim(), login: $('cLogin').value.trim(), password: $('cPass').value }); if (r) e.target.reset(); }
async function importKeys(input) {
  const f = input.files[0]; if (!f) return;
  try { const json = JSON.parse(await f.text()); await act('/supervisor/answers', { answerKeys: json.answerKeys || json }); }
  catch { toast(errText('invalid_answer_key')); }
  input.value = '';
}

// ---------- effects ----------
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const colors = ['#7c6cf5', '#35c3b0', '#ffc857', '#ff7aa2', '#4f8df7'];
  for (let i = 0; i < 70; i++) { const s = document.createElement('i'); s.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;animation-duration:${1.6 + Math.random() * 1.4}s;transform:rotate(${Math.random() * 360}deg)`; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3600);
}

// ---------- wiring ----------
$('langRu').addEventListener('click', () => setLang('ru'));
$('langKk').addEventListener('click', () => setLang('kk'));
$('supervisorLink').addEventListener('click', openSupervisorDialog);
$('brandLink').addEventListener('click', e => { e.preventDefault(); if (session?.role === 'teacher') go('home'); else if (session?.role === 'supervisor') { detail = null; go('teachers'); } else { classInfo = null; setUrlCode(''); render(); } });
$('signout').addEventListener('click', async () => { try { await api('/logout', 'POST', {}); } catch {} detail = null; tab = 'home'; await load(); });
$('dialog').addEventListener('click', e => { if (e.target === $('dialog')) closeDialog(); });
// Keep views fresh without interrupting typing.
setInterval(() => {
  if (document.hidden || !session || $('dialog').open) return;
  if (document.activeElement?.matches('input, textarea, select') || $('ansPhoto')?.files.length) return;
  if (session.role === 'teacher' && tab === 'test' && !data?.quiz) return;
  if (!session.role && !classInfo) return;
  load(true);
}, 12000);
load();
