document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const taskList = document.getElementById('task-list');
    const newTaskInput = document.getElementById('new-task');
    const addTaskBtn = document.getElementById('add-task-btn');
    const downloadTasksBtn = document.getElementById('download-tasks');
    const uploadTasksBtn = document.getElementById('upload-tasks-btn');
    const uploadTasksInput = document.getElementById('upload-tasks');
    const progressBar = document.querySelector('.progress');
    const quoteElement = document.getElementById('motivational-quote');
    const prevDateBtn = document.getElementById('prev-date');
    const nextDateBtn = document.getElementById('next-date');
    const currentDateSpan = document.getElementById('current-date');

    // 날짜별 할 일 목록을 저장할 객체
    let dailyTasks = {};

    // 현재 선택된 날짜 (서울 표준시 기준)
    let currentDate = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];

    // Theme toggle
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        this.innerHTML = document.body.classList.contains('dark-mode') 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
        
        // Save theme preference
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // Load saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // 날짜별 할 일 목록 저장
    function saveDailyTasks() {
        localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
    }

    // 날짜별 할 일 목록 불러오기
    function loadDailyTasks() {
        const savedTasks = localStorage.getItem('dailyTasks');
        if (savedTasks) {
            dailyTasks = JSON.parse(savedTasks);
        }
    }

    // 특정 날짜의 할 일 목록 렌더링
    function renderTasks(date) {
        taskList.innerHTML = '';
        
        if (!dailyTasks[date]) {
            // 새 날짜의 경우 기본 할 일 목록 생성
            dailyTasks[date] = [
                { id: 'email', text: '이메일 플래그 지금 정리하라!', checked: false },
                { id: 'task', text: '과제 지금 관리하라!', checked: false },
                { id: 'daily-check', text: '오늘 할 일 목록 당장 점검하라!', checked: false },
                { id: 'reading', text: '책 30분 이상 읽어라!', checked: false },
                { id: 'study', text: '1시간 이상 집중 공부하라!', checked: false },
                { id: 'diary', text: '오늘의 일기 반드시 작성하라!', checked: false }
            ];
        }

        // 체크된 항목과 체크되지 않은 항목을 분리
        const checkedTasks = dailyTasks[date].filter(task => task.checked);
        const uncheckedTasks = dailyTasks[date].filter(task => !task.checked);

        // 체크된 항목 렌더링
        checkedTasks.forEach(task => {
            const li = createTaskElement(task, false);
            taskList.appendChild(li);
        });

        // 체크되지 않은 항목 렌더링
        uncheckedTasks.forEach(task => {
            const li = createTaskElement(task, true);
            taskList.appendChild(li);
        });

        updateProgress();
    }

    function createTaskElement(task, draggable) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.draggable = draggable;
        li.dataset.id = task.id;
        li.innerHTML = `
            <input type="checkbox" id="${task.id}" ${task.checked ? 'checked' : ''}>
            <span class="task-text ${task.checked ? 'checked' : ''}" data-id="${task.id}">${task.text}</span>
            <input type="text" class="edit-task" data-id="${task.id}" value="${task.text}">
            <button class="delete-task" data-id="${task.id}">×</button>
        `;
        return li;
    }

    // 새로운 할 일 추가 함수
    function addNewTask() {
        const text = newTaskInput.value.trim();
        if (text) {
            // 현재 날짜의 할 일 목록 가져오기
            const currentTasks = dailyTasks[currentDate] || [];
            
            // 중복 검사 (대소문자 구분 없이)
            if (currentTasks.some(task => task.text.toLowerCase() === text.toLowerCase())) {
                alert('이미 존재하는 할 일입니다.');
                return;
            }

            const newTask = {
                id: 'task-' + Date.now(),
                text: text,
                checked: false
            };
            if (!dailyTasks[currentDate]) {
                dailyTasks[currentDate] = [];
            }
            dailyTasks[currentDate].push(newTask);
            newTaskInput.value = '';
            renderTasks(currentDate);
            saveDailyTasks();
        }
    }

    // 새로운 할 일 추가 (버튼 클릭)
    addTaskBtn.addEventListener('click', addNewTask);

    // 새로운 할 일 추가 (엔터 키 입력)
    newTaskInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            addNewTask();
        }
    });

    // 날짜 변경 함수
    function changeDate(offset) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + offset);
        currentDate = date.toISOString().split('T')[0];
        currentDateSpan.textContent = formatDate(currentDate);
        renderTasks(currentDate);
    }

    // 날짜 포맷 함수
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ko-KR', options);
    }

    // 할 일 목록 다운로드
    downloadTasksBtn.addEventListener('click', function() {
        // 현재 날짜의 할 일 목록만 가져오기
        const currentTasks = dailyTasks[currentDate] || [];
        const tasksJson = JSON.stringify(currentTasks);
        
        const blob = new Blob([tasksJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // 파일명에 날짜 포함
        a.download = `tasks_${currentDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 할 일 목록 업로드
    uploadTasksBtn.addEventListener('click', function() {
        uploadTasksInput.click();
    });

    uploadTasksInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const uploadedTasks = JSON.parse(e.target.result);
                    const existingTasks = dailyTasks[currentDate] || [];
                    
                    // 중복 제거하면서 새로운 할 일 추가
                    uploadedTasks.forEach(newTask => {
                        // 텍스트가 동일한 기존 할 일 찾기
                        const existingTask = existingTasks.find(existingTask => 
                            existingTask.text.toLowerCase() === newTask.text.toLowerCase()
                        );

                        if (existingTask) {
                            // 기존 할 일이 있는 경우, checked 상태만 업데이트
                            // 둘 중 하나라도 완료 상태면 완료로 표시
                            existingTask.checked = existingTask.checked || newTask.checked;
                        } else {
                            // 새로운 할 일 추가
                            existingTasks.push({
                                text: newTask.text,
                                checked: newTask.checked,
                                id: 'task-' + Date.now() + Math.random().toString(36).substr(2, 5)
                            });
                        }
                    });
                    
                    // 현재 날짜의 할 일 목록 업데이트
                    dailyTasks[currentDate] = existingTasks;
                    
                    renderTasks(currentDate);
                    saveDailyTasks();
                    
                    // 파일 입력 초기화
                    event.target.value = '';
                    
                    alert('할 일 목록이 성공적으로 업로드되었습니다.');
                } catch (error) {
                    console.error('Invalid JSON file:', error);
                    alert('올바르지 않은 파일 형식입니다.');
                }
            };
            reader.readAsText(file);
        }
    });

    // Progress bar update
    function updateProgress() {
        const tasks = dailyTasks[currentDate] || [];
        const total = tasks.length;
        const checked = tasks.filter(task => task.checked).length;
        const percentage = total > 0 ? (checked / total) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${Math.round(percentage)}%`;
        saveDailyTasks();
    }

    taskList.addEventListener('change', function(event) {
        if (event.target.type === 'checkbox') {
            const taskId = event.target.id;
            const task = dailyTasks[currentDate].find(t => t.id === taskId);
            if (task) {
                task.checked = event.target.checked;
                renderTasks(currentDate);
            }
        }
    });

    // 드래그 앤 드롭 기능 수정
    let draggedItem = null;
    let placeholder = null;

    taskList.addEventListener('dragstart', function(e) {
        if (e.target.draggable) {
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', draggedItem.innerHTML);
            draggedItem.classList.add('dragging');
            
            // 플레이스홀더 생성
            placeholder = document.createElement('li');
            placeholder.classList.add('task-item', 'placeholder');
            placeholder.style.height = `${draggedItem.offsetHeight}px`;
            draggedItem.parentNode.insertBefore(placeholder, draggedItem.nextSibling);
        }
    });

    taskList.addEventListener('dragend', function(e) {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            placeholder = null;
            updateTaskOrder();
        }
    });

    taskList.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (draggedItem && placeholder) {
            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement == null) {
                taskList.appendChild(placeholder);
            } else {
                taskList.insertBefore(placeholder, afterElement);
            }
        }
    });

    taskList.addEventListener('dragenter', function(e) {
        e.preventDefault();
    });

    taskList.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedItem && placeholder) {
            taskList.insertBefore(draggedItem, placeholder);
            draggedItem.classList.add('moving');
            setTimeout(() => {
                draggedItem.classList.remove('moving');
            }, 300);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging):not(.placeholder)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateTaskOrder() {
        const newOrder = Array.from(taskList.children)
            .filter(li => !li.classList.contains('placeholder'))
            .map(li => {
                const taskId = li.dataset.id;
                return dailyTasks[currentDate].find(task => task.id === taskId);
            });
        dailyTasks[currentDate] = newOrder;
        saveDailyTasks();
    }

    // Motivational quotes
    const quotes = [
        // // 일을 미루지 않고 즉시 행하록 하는 명언
        // "오늘 할 수 있는 일을 내일로 미루지 마라. - 벤자민 프랭클린",
        // "지금 이 순간에 그대의 행동을 다스려라. 순간의 일이 그대의 먼 장래를 결정한다. - 릴케",
        // "즉시 행동은 즉시 이익이며, 더 많은 실천은 더 많은 이익이다.",
        // "결단을 내리면 즉시 실천하라. 김은 새어나가기 마련이다. - 손자병법",
        // "너는 머뭇거릴 수 있지만, 시간은 그렇지 않다. - 벤자민 프랭클린",
        // "지금 그것을 하지 않으면 언제 할 수 있는 날이 있을까. - 히레",
        // "행동하라! 무엇인가를 행하라! 하찮은 것이라도 상관없다. - 베르나르 베르베르",
        // "말하고자 하는 바를 먼저 실행하라. 그런 다음 말하라. - 공자",
        // "오래 미룰수록 시작하기가 어려워진다. - 나폴레온 힐",
        // "지금 즉시 행동하라. 그러나 약간이라도 지체하면, 세상의 차가운 공기가 너의 마음을 금방 식혀 놓을 것이다.",
        // // 어려운 상황에서도 헤쳐나가라는 명언
        // "넘어지지 않고 힘들어하는 것이 요한 게 아니라, 넘어진 뒤에 일어서는 것이 중요해. - 반자메릭",
        // "성공은 가장 어려운 시간에 일어납니다. - 피터 F. 드러커",
        // "더 큰 도전을 이겨낼 때마다 더 큰 성취가 기다리고 있어. - 스티브 마블리",
        // "어려운 시기수록 용기를 가져야 합니다. - 윈스턴 처칠",
        // "고난이 클수록 더 큰 영광이 다가온다. - 키케로",
        // "인생의 가장 큰 영광은 결코 넘어지지 않는 데 있는 것이 아니라 넘어질 때마다 일어서는 데 있다. - 넬슨 만델라",
        // "고통은 인내를 낳고 인내는 시련을 이겨내는 끈기를 낳고 끈기는 희망을 낳는다. - 성경",
        // "인생에서 고난을 극복하고 성공을 향해 힘찬 발걸음을 내딛으며 새로운 소망과 함께 그것을 성취하려고 애쓰는 것보다 더 고상한 즐거움은 없다. - 사무엘 존슨",
        // "세상은 고통으로 가득하지만 그것을 극복하는 사람들로도 가득하다 - 헬렌 켈러",
        // "용기있는 자로 살아라. 운이 따라주지 않는다면 용기 있는 가슴으로 불행에 맞서라. - 키케로",
        // // 행동의 중요성을 강조하는 명언
        // "행동 없는 식견은 백일몽이요, 식견  행동은 악몽이다. - 일본 속담",
        // "행동이 항상 행복을 가져오는 것은 아니다. 그러나 행동 없이는 행복도 없다. - 벤자민 디스렐리",
        // "말보다는 행동이다. 행동 없이 이룰 수 있는 일은 없다. - 나폴레온 힐",
        // "불안이나 두려움을 없애주는 것이 행동이다.",
        // "보다 행동이 더 설득력을 갖는다.",
        // "행동은 당신의 인생을 부각시키고, 행동은 세계를 형성한다.... 행동은 말보��� 그 소리가 크다. - 탈무드",
        // "행동은 말보다 진실을 잘 나타나게 마련이다. - 디오도어 루빈",
        // "행동력을 착실하게 향상시키려면 당신이 해야할 일을 이 순간부터 주저 말고 시작하는 것이며, 전력을 다하여 부딪혀 나가는 일이다. - 하라잇뻬이",
        // "행동으로 옮겨진 지식만이 마음에 남는 법이다.",
        // "민첩하고 기운차게 행동하라. '그렇지만' 이라든지 '만약' 이라든지 '왜' 라는 말들을 앞세우지 말라. - 나폴레옹"
        "지금 그거 15분이 한다.",
    ];

    function updateQuote() {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteElement.textContent = quotes[randomIndex];
    }

    // Update quote every 10 seconds
    updateQuote();
    setInterval(updateQuote, 10000);

    // Add hover effect to cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 초기화 함수
    function initialize() {
        loadDailyTasks();
        loadTasksFromUrl(); // URL에서 할 일 목록 로드
        renderTasks(currentDate);
        currentDateSpan.textContent = formatDate(currentDate);

        // 이전 날짜 버튼
        prevDateBtn.addEventListener('click', () => changeDate(-1));
        // 다음 날짜 버튼
        nextDateBtn.addEventListener('click', () => changeDate(1));
    }

    // 초기화
    initialize();

    // 페이지 로드 시 현재 날짜 표시
    currentDateSpan.textContent = formatDate(currentDate);
    renderTasks(currentDate);

    // 오늘 버튼 요소 선택
    const todayDateBtn = document.getElementById('today-date');

    // 오늘 날짜로 이동하는 함수 (서울 표준시 기준)
    function goToToday() {
        const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
        currentDate = now.toISOString().split('T')[0];
        currentDateSpan.textContent = formatDate(currentDate);
        renderTasks(currentDate);
    }

    // 오늘 버튼 클릭 이벤트 리스너
    todayDateBtn.addEventListener('click', goToToday);

    // 할 일 수정 기능
    taskList.addEventListener('click', function(event) {
        if (event.target.classList.contains('task-text')) {
            const taskId = event.target.dataset.id;
            const taskTextSpan = event.target;
            const editInput = event.target.nextElementSibling;
            
            taskTextSpan.style.display = 'none';
            editInput.style.display = 'inline-block';
            editInput.focus();
        }
    });

    taskList.addEventListener('keyup', function(event) {
        if (event.target.classList.contains('edit-task') && event.key === 'Enter') {
            const taskId = event.target.dataset.id;
            const newText = event.target.value.trim();
            const taskTextSpan = event.target.previousElementSibling;
            
            if (newText) {
                const task = dailyTasks[currentDate].find(t => t.id === taskId);
                if (task) {
                    task.text = newText;
                    taskTextSpan.textContent = newText;
                    saveDailyTasks();
                }
            }
            
            event.target.style.display = 'none';
            taskTextSpan.style.display = 'inline';
        }
    });

    taskList.addEventListener('blur', function(event) {
        if (event.target.classList.contains('edit-task')) {
            const taskTextSpan = event.target.previousElementSibling;
            event.target.style.display = 'none';
            taskTextSpan.style.display = 'inline';
        }
    }, true);

    // 할 일 삭제 기능
    taskList.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-task')) {
            const taskId = event.target.dataset.id;
            dailyTasks[currentDate] = dailyTasks[currentDate].filter(task => task.id !== taskId);
            renderTasks(currentDate);
            saveDailyTasks();
        }
    });

    // URL 복사 버튼 이벤트 리스너
    document.getElementById('copy-url-btn').addEventListener('click', function() {
        const tasksForDate = dailyTasks[currentDate] || [];
        const encodedTasks = encodeURIComponent(JSON.stringify(tasksForDate));
        const url = `${window.location.origin}${window.location.pathname}#${currentDate}:${encodedTasks}`;
        
        navigator.clipboard.writeText(url).then(() => {
            alert('URL이 클립보드에 복사되었습니다.');
        }).catch(err => {
            console.error('URL 복사 실패:', err);
            alert('URL 복사에 실패했습니다.');
        });
    });

    // URL에서 할 일 목록 읽기
    function loadTasksFromUrl() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const [date, encodedTasks] = hash.split(':');
            if (date && encodedTasks) {
                try {
                    const decodedTasks = JSON.parse(decodeURIComponent(encodedTasks));
                    
                    // 기존 할 일 목록 가져오기
                    const existingTasks = dailyTasks[date] || [];
                    
                    // 중복 제거 및 새 할 일 추가
                    decodedTasks.forEach(newTask => {
                        if (!existingTasks.some(existingTask => existingTask.text === newTask.text)) {
                            existingTasks.push(newTask);
                        }
                    });
                    
                    dailyTasks[date] = existingTasks;
                    currentDate = date;
                    renderTasks(currentDate);
                    saveDailyTasks();
                    currentDateSpan.textContent = formatDate(currentDate);
                    
                    // URL 해시 제거 및 리디렉션
                    window.location.hash = '';
                    history.replaceState(null, '', window.location.pathname);
                } catch (error) {
                    console.error('URL에서 할 일 목록 로드 실패:', error);
                }
            }
        }
    }
});
