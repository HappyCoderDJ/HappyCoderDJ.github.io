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
    let focusTasks = []; // [{title, startTime, endTime, completed, duration}]
    let timerStatus = {
        isRunning: false,
        startTime: null,
        remainingTime: 0,
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
        const circumference = 2 * Math.PI * 45; // 원의 둘레 (r=45)
        const offset = circumference * (1 - progress);
        timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
        timerProgress.style.strokeDashoffset = offset;
    }

    function startTimer(isRestoring = false) {
        const focusTitle = document.getElementById('focus-title').value.trim();
        const focusTime = parseInt(document.getElementById('focus-time').value) || 25;
        
        if (!isRestoring && !focusTitle) {
            alert('집중 제목을 입력해주세요.');
            return;
        }

        if (timerInterval) {
            clearInterval(timerInterval);
        }

        if (!isRestoring) {
            remainingTime = focusTime * 60;
            // 원형 타이머 초기화
            const timerProgress = document.querySelector('.timer-progress');
            const circumference = 2 * Math.PI * 45;
            timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
            timerProgress.style.strokeDashoffset = 0;
            
            const newTask = {
                title: focusTitle,
                startTime: new Date().toISOString(),
                duration: focusTime,
                completed: false
            };
            focusTasks.unshift(newTask);
            saveFocusTasks();
            renderFocusTasks();
        }

        timerStatus = {
            isRunning: true,
            startTime: new Date().getTime(),
            remainingTime: remainingTime,
            focusTitle: focusTitle,
            focusDuration: focusTime
        };
        
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateTimerDisplay();
                timerStatus.remainingTime = remainingTime;
                saveTimerStatus();
            } else {
                completeTimer();
            }
        }, 1000);

        // 타이머 시작 시 버튼 상태 변경
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
    }

    function pauseTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerStatus.isRunning = false;
            saveTimerStatus();
            
            // 현재 진행 중인 작업의 상태 업데이트
            if (focusTasks.length > 0) {
                const currentTask = focusTasks[0];
                if (!currentTask.endTime) {  // endTime이 없는 경우에만 업데이트
                    currentTask.endTime = new Date().toISOString();
                    // 실제 진행된 시간 계산 (분 단위)
                    const startTime = new Date(currentTask.startTime);
                    const endTime = new Date(currentTask.endTime);
                    currentTask.duration = Math.round((endTime - startTime) / (1000 * 60));
                    saveFocusTasks();
                    renderFocusTasks();
                }
            }
            
            // 타이머 일시정지 시 버튼 상태 변경
            startTimerBtn.disabled = false;
            pauseTimerBtn.disabled = true;
        }
    }

    function extendTimer() {
        const extendMinutes = parseInt(document.getElementById('extend-time').value) || 0;
        remainingTime += extendMinutes * 60;
        timerStatus.remainingTime = remainingTime;
        saveTimerStatus();
        updateTimerDisplay();
    }

    function completeTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerStatus.isRunning = false;
        saveTimerStatus();
        
        if (focusTasks.length > 0) {
            const currentTask = focusTasks[0];
            currentTask.completed = true;
            currentTask.endTime = new Date().toISOString();
            // 실제 진행된 시간 계산
            const startTime = new Date(currentTask.startTime);
            const endTime = new Date(currentTask.endTime);
            currentTask.duration = Math.round((endTime - startTime) / (1000 * 60));
            saveFocusTasks();
            renderFocusTasks();
        }
        
        // 타이머 완료 시 버튼 상태 초기화
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
        focusTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'focus-task-item';
            
            // 시간 포맷팅
            const startTimeStr = task.startTime ? new Date(task.startTime).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '';
            const endTimeStr = task.endTime ? new Date(task.endTime).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '';
            
            // 총 시간 계산
            const durationStr = task.duration ? `${task.duration}분` : '';
            
            li.innerHTML = `
                <div class="task-info">
                    <span class="task-title ${task.completed ? 'completed' : ''}" data-index="${index}">${task.title}</span>
                    <input type="text" class="edit-title" value="${task.title}" style="display: none;">
                    <span class="task-time">
                        <input type="time" class="edit-start-time" value="${formatTimeForInput(task.startTime)}" style="display: none;">
                        <span class="time-text">${startTimeStr} - ${endTimeStr}</span>
                        <input type="time" class="edit-end-time" value="${formatTimeForInput(task.endTime)}" style="display: none;">
                    </span>
                    <span class="task-duration">${durationStr}</span>
                </div>
                <div class="task-controls">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <button class="delete-focus-task" data-index="${index}">×</button>
                </div>
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
        // 체크박스 클릭 처리
        if (e.target.classList.contains('task-checkbox')) {
            const taskItem = e.target.closest('.focus-task-item');
            const index = parseInt(taskItem.querySelector('.task-title').dataset.index);
            const task = focusTasks[index];
            
            task.completed = e.target.checked;
            if (task.completed && !task.endTime) {
                task.endTime = new Date().toISOString();
            }
            
            saveFocusTasks();
            renderFocusTasks();
        }
        // 삭제 버튼 클릭 처리
        else if (e.target.classList.contains('delete-focus-task')) {
            const index = parseInt(e.target.dataset.index);
            if (confirm('이 작업을 삭제하시겠습니까?')) {
                focusTasks.splice(index, 1);
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
            const task = focusTasks[index];

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
            focusTasks.unshift(newTask); // 배열 앞쪽에 추가
            newFocusTaskInput.value = '';
            renderFocusTasks();
            saveFocusTasks();
        }
    });

    // 타이머 상태 저장 함수
    function saveTimerStatus() {
        localStorage.setItem('timerStatus', JSON.stringify({
            ...timerStatus,
            lastSaved: new Date().getTime()
        }));
    }

    // 타이머 상태 불러오기 함수
    function loadTimerStatus() {
        const savedStatus = localStorage.getItem('timerStatus');
        if (savedStatus) {
            const status = JSON.parse(savedStatus);
            const now = new Date().getTime();
            const timePassed = Math.floor((now - status.lastSaved) / 1000);
            
            if (status.isRunning && status.remainingTime > timePassed) {
                timerStatus = status;
                remainingTime = status.remainingTime - timePassed;
                document.getElementById('focus-title').value = status.focusTitle;
                document.getElementById('focus-time').value = status.focusDuration;
                startTimer(true);
            }
        }
    }
});
