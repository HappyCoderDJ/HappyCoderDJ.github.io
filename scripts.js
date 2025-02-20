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
    const startTimerBtn = document.getElementById('start-timer');
    const pauseTimerBtn = document.getElementById('pause-timer');
    const extendTimerBtn = document.getElementById('extend-timer');
    const timerDisplay = document.getElementById('timer-countdown');
    const focusTasksList = document.getElementById('focus-tasks');
    const addFocusTaskBtn = document.getElementById('add-focus-task-btn');
    const newFocusTaskInput = document.getElementById('new-focus-task');

    // 날짜별 할 일 목록을 저장할 객체
    let dailyTasks = {};
    let timerInterval = null;
    let remainingTime = 0;
    let focusTasks = {}; // { '2024-03-21': [{title, startTime, endTime, completed, duration}], ... }
    let timerStatus = {
        isRunning: false,
        startTime: null,      // 타이머 시작 시간 (ISO string)
        totalDuration: 0,     // 전체 타이머 시간 (초)
        elapsedTime: 0,       // 이미 경과한 시간 (초)
        focusTitle: '',
        focusDuration: 0
    };

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
            ${!task.checked ? `
                <button class="start-task-timer" data-id="${task.id}" title="이 작업으로 타이머 시작">
                    ⏰
                </button>
            ` : ''}
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

    // 날짜 변경 함수 수정
    function changeDate(offset) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + offset);
        currentDate = date.toISOString().split('T')[0];
        currentDateSpan.textContent = formatDate(currentDate);
        renderTasks(currentDate);
        // 집중작업 목록도 함께 업데이트
        renderFocusTasks();
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
        "지금 그거 15분이면 한다.",
        "하루 물림이 열흘간다. - 한국 속담.",
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
        loadFocusTasks();
        loadTasksFromUrl();
        loadTimerStatus();
        renderTasks(currentDate);
        currentDateSpan.textContent = formatDate(currentDate);

        // 이전 날짜 버튼
        prevDateBtn.addEventListener('click', () => changeDate(-1));
        // 다음 날짜 버튼
        nextDateBtn.addEventListener('click', () => changeDate(1));

        // 타이머 시작 버튼 클릭 이벤트 처리
        taskList.addEventListener('click', function(event) {
            const timerBtn = event.target.closest('.start-task-timer');
            if (timerBtn) {
                const taskId = timerBtn.dataset.id;
                const task = dailyTasks[currentDate].find(t => t.id === taskId);
                
                if (timerInterval) {
                    alert('이미 진행 중인 타이머가 있습니다. 현재 타이머를 중단하고 새로운 작업을 시작하려면 먼저 타이머를 중단해주세요.');
                    return;
                }

                if (task) {
                    // 타이머 입력 필드들 설정
                    document.getElementById('focus-title').value = task.text;
                    document.getElementById('focus-time').value = "30";
                    document.getElementById('selected-time-input').value = "30";
                    
                    // 타이머 시작
                    startTimer();
                    
                    // 타이머 섹션으로 스크롤
                    document.getElementById('focus-section').scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // 초기화 실행
    initialize();

    // 페이지 로드 시 현재 날짜 표시
    currentDateSpan.textContent = formatDate(currentDate);
    renderTasks(currentDate);

    // 오늘 버튼 요소 선택
    const todayDateBtn = document.getElementById('today-date');

    // 오늘 날짜로 이동하는 함수도 수정 (서울 표준시 기준)
    function goToToday() {
        const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
        currentDate = now.toISOString().split('T')[0];
        currentDateSpan.textContent = formatDate(currentDate);
        renderTasks(currentDate);
        // 집중작업 목록도 함께 업데이트
        renderFocusTasks();
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

    // 시간 입력 필드에서 엔터 키 이벤트 처리 추가
    const focusTimeInput = document.getElementById('focus-time');
    const focusTitleInput = document.getElementById('focus-title');

    function handleEnterKey(e) {
        if (e.key === 'Enter') {
            startTimer();
        }
    }

    focusTimeInput.addEventListener('keyup', handleEnterKey);
    focusTitleInput.addEventListener('keyup', handleEnterKey);

    // 타이머 관련 함수들
    function updateTimerDisplay() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // 원형 타이머 업데이트
        const timerProgress = document.querySelector('.timer-progress');
        const totalTime = timerStatus.focusDuration * 60;
        const progress = remainingTime / totalTime;
        const circumference = 2 * Math.PI * 45;
        const offset = circumference * (1 - progress);
        
        // 프로그레스 바가 갑자기 변하지 않도록 transition 추가
        timerProgress.style.transition = 'stroke-dashoffset 0.5s linear';
        timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
        timerProgress.style.strokeDashoffset = offset;

        // 마지막 5분 체크
        const isLastFiveMinutes = remainingTime <= 300;
        
        // 타이머 색상 변경
        timerDisplay.style.color = isLastFiveMinutes ? '#ff4444' : '';
        
        // 프로그레스 바 색상 변경
        timerProgress.style.stroke = isLastFiveMinutes ? '#ff4444' : '';
    }

    // 시간 프리셋 버튼 이벤트 처리
    const timeButtons = document.querySelectorAll('.time-preset');
    const selectedTimeInput = document.getElementById('selected-time-input');
    const resetTimeBtn = document.getElementById('reset-time');

    // 초기값 설정 부분 수정
    selectedTimeInput.value = "30";
    focusTimeInput.value = "30";

    // 리셋 버튼 이벤트 처리 수정
    resetTimeBtn.addEventListener('click', function() {
        // 시간을 초기화
        selectedTimeInput.value = "30";
        focusTimeInput.value = "30";
        
        // 모든 버튼의 active 상태 제거
        timeButtons.forEach(btn => btn.classList.remove('active'));
        
        // 타이머가 실행 중이 아닐 때만 타이머 표시도 업데이트
        if (!timerInterval) {
            const timerDisplay = document.getElementById('timer-countdown');
            timerDisplay.textContent = "00:00";
            
            // 프로그레스 바도 초기화
            const timerProgress = document.querySelector('.timer-progress');
            const circumference = 2 * Math.PI * 45;
            timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
            timerProgress.style.strokeDashoffset = circumference; // 완전히 비어있는 상태
        }
    });

    // 선택된 시간 입력 처리
    selectedTimeInput.addEventListener('input', function() {
        const minutes = parseInt(this.value) || 30;
        focusTimeInput.value = minutes;
        
        // 버튼들의 active 상태 제거
        timeButtons.forEach(btn => btn.classList.remove('active'));
    });

    // 시간 버튼 클릭 처리
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 모든 버튼에서 active 클래스 제거
            timeButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 현재 입력된 값에 버튼의 값을 더함
            const currentValue = parseInt(selectedTimeInput.value) || 30;
            const buttonValue = parseInt(this.dataset.minutes);
            const newValue = currentValue + buttonValue;
            
            // 입력창과 hidden input 업데이트
            selectedTimeInput.value = newValue;
            focusTimeInput.value = newValue;
        });
    });

    // startTimer 함수 수정
    function startTimer(isRestoring = false) {
        let focusTitle = document.getElementById('focus-title').value.trim();
        const focusTime = parseInt(document.getElementById('focus-time').value) || 25;
        
        if (!focusTitle) {
            focusTitle = "무제";
            document.getElementById('focus-title').value = focusTitle;
        }

        if (timerInterval) {
            clearInterval(timerInterval);
        }

        if (!isRestoring) {
            const now = new Date();
            timerStatus = {
                isRunning: true,
                startTime: now.toISOString(),
                totalDuration: focusTime * 60,
                elapsedTime: 0,
                focusTitle: focusTitle,
                focusDuration: focusTime
            };
        }

        updateTimerDisplay();
        startTimerInterval();
        saveTimerStatus();

        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;

        // 집중작업 이력 업데이트
        renderFocusTasks();
    }

    // 새로운 함수 추가 (startTimer 함수 뒤에)
    function startTimerInterval() {
        timerInterval = setInterval(() => {
            if (!timerStatus.isRunning) return;

            const now = new Date();
            const start = new Date(timerStatus.startTime);
            const totalElapsed = Math.floor((now - start) / 1000);
            
            // 경과 시간이 총 시간을 초과하지 않도록 함
            timerStatus.elapsedTime = Math.min(totalElapsed, timerStatus.totalDuration);
            remainingTime = timerStatus.totalDuration - timerStatus.elapsedTime;

            if (remainingTime <= 0) {
                completeTimer();
            } else {
                updateTimerDisplay();
                saveTimerStatus();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerStatus.isRunning = false;
            saveTimerStatus();
            
            const now = new Date();
            const endDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
            
            if (!focusTasks[endDate]) {
                focusTasks[endDate] = [];
            }

            const newTask = {
                title: timerStatus.focusTitle,
                startTime: timerStatus.startTime,
                endTime: now.toISOString(),
                completed: false,
                duration: Math.round((now - new Date(timerStatus.startTime)) / (1000 * 60))
            };
            
            focusTasks[endDate].unshift(newTask);
            saveFocusTasks();
            renderFocusTasks();
            
            startTimerBtn.disabled = false;
            pauseTimerBtn.disabled = true;
        }
    }

    function extendTimer() {
        const extendMinutes = parseInt(document.getElementById('extend-time').value) || 0;
        if (extendMinutes <= 0) return;

        // 전체 타이머 시간 업데이트
        timerStatus.totalDuration += extendMinutes * 60;
        timerStatus.focusDuration += extendMinutes;
        
        // 현재 경과 시간은 유지한 채로 남은 시간만 연장
        remainingTime += extendMinutes * 60;
        
        // 타이머가 실행 중이 아니면 다시 시작
        if (!timerInterval) {
            startTimerInterval();
        }

        // 원형 타이머 업데이트
        updateTimerDisplay();
        
        // 타이머 상태 저장
        saveTimerStatus();
        
        // 진행 중인 작업 목록 업데이트를 위해 renderFocusTasks 호출
        renderFocusTasks();
        
        // 입력 필드 초기화
        document.getElementById('extend-time').value = '';
    }

    function completeTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerStatus.isRunning = false;
        saveTimerStatus();
        
        const now = new Date();
        const endDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
        
        if (!focusTasks[endDate]) {
            focusTasks[endDate] = [];
        }
        
        const newTask = {
            title: timerStatus.focusTitle,
            startTime: timerStatus.startTime,
            endTime: now.toISOString(),
            completed: true,
            duration: timerStatus.focusDuration
        };
        
        focusTasks[endDate].unshift(newTask);
        saveFocusTasks();
        renderFocusTasks();
        
        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
        
        alert('집중 시간이 완료되었습니다!');
    }

    // 집중 작업 관련 함수들
    function saveFocusTasks() {
        localStorage.setItem('focusTasks', JSON.stringify(focusTasks));
    }

    function loadFocusTasks() {
        const savedTasks = localStorage.getItem('focusTasks');
        if (savedTasks) {
            focusTasks = JSON.parse(savedTasks);
            renderFocusTasks();
        }
    }

    function renderFocusTasks() {
        focusTasksList.innerHTML = '';
        
        // 현재 날짜의 작업만 표시
        const tasksForDate = focusTasks[currentDate] || [];
        
        // 진행 중인 타이머가 있고, 해당 날짜에 속하는 경우 추가
        const now = new Date();
        const currentTaskDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
        
        let allTasks = [...tasksForDate];
        
        if (timerStatus.isRunning && currentDate === currentTaskDate) {
            const runningTask = {
                title: timerStatus.focusTitle,
                startTime: timerStatus.startTime,
                duration: timerStatus.focusDuration, // focusDuration 사용하여 총 시간 표시
                completed: false,
                isRunning: true
            };
            allTasks.unshift(runningTask);
        }

        if (allTasks.length === 0) {
            return;
        }

        allTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'focus-task-item';
            if (task.isRunning) {
                li.classList.add('running'); // 실행 중인 작업 스타일링을 위한 클래스 추가
            }
            
            const startTimeStr = task.startTime ? new Date(task.startTime).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '';
            
            const endTimeStr = task.endTime ? new Date(task.endTime).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '';
            
            li.innerHTML = `
                <div class="task-info">
                    <span class="task-title">${task.title}${task.isRunning ? ' (진행 중)' : ''}</span>
                    <span class="task-time-info">
                        <span class="task-duration">${task.duration}분</span>
                        <span class="separator">·</span>
                        <span class="task-time">${startTimeStr}</span>
                        ${endTimeStr ? `<span class="separator">-</span><span class="task-time">${endTimeStr}</span>` : ''}
                    </span>
                </div>
                ${!task.isRunning ? '<button class="delete-task">×</button>' : ''}
            `;
            
            focusTasksList.appendChild(li);
        });
    }

    // 시간을 input type="time"용 포맷으로 변환하는 함수
    function formatTimeForInput(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    // 편집 관련 이벤트 리스너 추가
    focusTasksList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-task')) {
            const taskItem = e.target.closest('li');
            const index = Array.from(focusTasksList.children).indexOf(taskItem);
            
            if (confirm('이 작업을 삭제하시겠습니까?')) {
                const taskTitle = taskItem.querySelector('.task-title').textContent;
                const endDate = new Date(currentDate).toISOString().split('T')[0];
                focusTasks[endDate] = focusTasks[endDate].filter(task => task.title !== taskTitle);
                saveFocusTasks();
                renderFocusTasks();
            }
        }
    });

    // 편집 완료 이벤트 처리
    focusTasksList.addEventListener('change', (e) => {
        if (e.target.classList.contains('edit-title') || 
            e.target.classList.contains('edit-start-time') || 
            e.target.classList.contains('edit-end-time')) {
            
            const taskItem = e.target.closest('.focus-task-item');
            const index = parseInt(taskItem.querySelector('.task-title').dataset.index);
            const task = focusTasks[currentDate][index];

            if (e.target.classList.contains('edit-title')) {
                task.title = e.target.value;
            } else if (e.target.classList.contains('edit-start-time')) {
                const timeStr = e.target.value;
                if (timeStr) {
                    const [hours, minutes] = timeStr.split(':');
                    const date = new Date(task.startTime || new Date());
                    date.setHours(hours, minutes);
                    task.startTime = date.toISOString();
                }
            } else if (e.target.classList.contains('edit-end-time')) {
                const timeStr = e.target.value;
                if (timeStr) {
                    const [hours, minutes] = timeStr.split(':');
                    const date = new Date(task.endTime || new Date());
                    date.setHours(hours, minutes);
                    task.endTime = date.toISOString();
                }
            }

            saveFocusTasks();
            renderFocusTasks();
        }
    });

    // 편집 취소 (ESC 키) 이벤트 처리
    focusTasksList.addEventListener('keyup', (e) => {
        if (e.key === 'Escape' && (
            e.target.classList.contains('edit-title') ||
            e.target.classList.contains('edit-start-time') ||
            e.target.classList.contains('edit-end-time')
        )) {
            renderFocusTasks();
        }
    });

    // 이벤트 리스너들
    startTimerBtn.addEventListener('click', () => startTimer());
    pauseTimerBtn.addEventListener('click', pauseTimer);
    extendTimerBtn.addEventListener('click', extendTimer);

    addFocusTaskBtn.addEventListener('click', () => {
        const taskTitle = newFocusTaskInput.value.trim();
        if (taskTitle) {
            // 올바른 형식의 작업 객체 생성
            const newTask = {
                title: taskTitle,
                startTime: new Date().toISOString(),
                duration: 0,
                completed: false
            };
            if (!focusTasks[currentDate]) {
                focusTasks[currentDate] = [];
            }
            focusTasks[currentDate].unshift(newTask);
            newFocusTaskInput.value = '';
            renderFocusTasks();
            saveFocusTasks();
        }
    });

    // 타이머 상태 저장 함수 수정
    function saveTimerStatus() {
        localStorage.setItem('timerStatus', JSON.stringify({
            ...timerStatus,
            lastSaved: new Date().getTime(),
            originalStartTime: timerStatus.startTime // 원래 시작 시간 저장
        }));
    }

    // 타이머 상태 불러오기 함수 수정
    function loadTimerStatus() {
        const savedStatus = localStorage.getItem('timerStatus');
        if (savedStatus) {
            const status = JSON.parse(savedStatus);
            
            if (status.isRunning && status.startTime) {
                const now = new Date();
                const start = new Date(status.startTime);
                const totalElapsed = Math.floor((now - start) / 1000);
                
                // 총 시간을 초과하지 않는 범위에서 경과 시간 계산
                const newElapsedTime = Math.min(totalElapsed, status.totalDuration);
                
                if (newElapsedTime < status.totalDuration) {
                    timerStatus = {
                        ...status,
                        elapsedTime: newElapsedTime
                    };
                    remainingTime = status.totalDuration - newElapsedTime;
                    
                    document.getElementById('focus-title').value = status.focusTitle;
                    document.getElementById('focus-time').value = status.focusDuration;
                    startTimer(true);
                } else {
                    // 이미 시간이 완료된 경우
                    completeTimer();
                }
            }
        }
    }

    // 초기화 시에는 타이머 상태가 있는 경우에만 값을 설정
    const savedStatus = localStorage.getItem('timerStatus');
    if (!savedStatus) {
        // 타이머 상태가 없을 때만 초기값 설정
        selectedTimeInput.value = "30";
        focusTimeInput.value = "30";
    }
});
