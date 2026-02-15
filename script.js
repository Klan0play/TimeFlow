let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let timerInterval = null;
let timerRunning = false;
let timerMode = 'work';
let timeLeft = 25 * 60;
let totalWorkTime = 25 * 60;
let totalBreakTime = 5 * 60;
let totalFocusTime = 0;
let currentSession = 1;
let focusSessions = 0;
let focusStreak = 0;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initTime();
    initTaskPlanner();
    initProductivityCalculator();
    initPomodoroTimer();
    initContactForm();
    initMobileMenu();
    renderTasks();
    loadTimerSettings();
    updateFocusStats();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 80,
                behavior: 'smooth'
            });
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    window.addEventListener('scroll', function() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

function initTime() {
    function updateTime() {
        const now = new Date();
        const timeDisplay = document.getElementById('timeDisplay');
        
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const timeDigits = timeDisplay.querySelector('.time-digits');
        timeDigits.innerHTML = `
            <span class="digit">${hours}</span>
            <span class="digit-separator">:</span>
            <span class="digit">${minutes}</span>
            <span class="digit-separator">:</span>
            <span class="digit">${seconds}</span>
        `;
        
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const timeDate = timeDisplay.querySelector('.time-date');
        timeDate.textContent = now.toLocaleDateString('ru-RU', options);
    }
    
    setInterval(updateTime, 1000);
    updateTime();
}

function initTaskPlanner() {
    const taskForm = document.getElementById('taskForm');
    const priorityButtons = document.querySelectorAll('.priority-btn');
    const timePresets = document.querySelectorAll('.time-preset');
    const clearFormBtn = document.getElementById('clearForm');
    const aiSuggestBtn = document.getElementById('aiSuggest');
    
    priorityButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            priorityButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('taskPriority').value = this.dataset.priority;
        });
    });
    
    timePresets.forEach(preset => {
        preset.addEventListener('click', function() {
            document.getElementById('taskTime').value = this.dataset.minutes;
        });
    });
    
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskName = document.getElementById('taskName').value;
        const taskCategory = document.getElementById('taskCategory').value;
        const taskPriority = document.getElementById('taskPriority').value;
        const taskTime = parseInt(document.getElementById('taskTime').value);
        
        const newTask = {
            id: Date.now(),
            name: taskName,
            category: taskCategory,
            priority: taskPriority,
            time: taskTime,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        showNotification('Задача добавлена!', 'success');
        
        taskForm.reset();
        document.getElementById('taskPriority').value = 'medium';
        document.querySelector('.priority-btn.medium').classList.add('active');
        document.querySelectorAll('.priority-btn:not(.medium)').forEach(btn => btn.classList.remove('active'));
    });
    
    clearFormBtn.addEventListener('click', function() {
        taskForm.reset();
        document.getElementById('taskPriority').value = 'medium';
        document.querySelector('.priority-btn.medium').classList.add('active');
        document.querySelectorAll('.priority-btn:not(.medium)').forEach(btn => btn.classList.remove('active'));
    });
    
    aiSuggestBtn.addEventListener('click', function() {
        const suggestions = [
            "Разбейте большие задачи на мелкие подзадачи",
            "Расставьте приоритеты по матрице Эйзенхауэра",
            "Используйте технику Pomodoro для концентрации",
            "Планируйте задачи на утро, когда продуктивность выше",
            "Включайте в план время для отдыха и перерывов"
        ];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        showNotification(`AI совет: ${randomSuggestion}`, 'info');
    });
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const totalTasks = document.getElementById('totalTasks');
    const activeTasks = document.getElementById('activeTasks');
    const completedTasks = document.getElementById('completedTasks');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-list-check"></i>
                </div>
                <h4>Нет задач</h4>
                <p>Создайте первую задачу</p>
            </div>
        `;
        totalTasks.textContent = '0';
        activeTasks.textContent = '0';
        completedTasks.textContent = '0';
        return;
    }
    
    const activeTasksCount = tasks.filter(task => !task.completed).length;
    const completedTasksCount = tasks.filter(task => task.completed).length;
    
    totalTasks.textContent = tasks.length;
    activeTasks.textContent = activeTasksCount;
    completedTasks.textContent = completedTasksCount;
    
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.innerHTML = `
            <div class="task-content">
                <div class="task-header">
                    <h4>${task.name}</h4>
                    <span class="task-time">${task.time} мин</span>
                </div>
                <div class="task-footer">
                    <span class="task-category">${getCategoryName(task.category)}</span>
                    <span class="task-priority ${task.priority}">${getPriorityName(task.priority)}</span>
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="complete-btn" data-id="${task.id}">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="delete-btn" data-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        tasksList.appendChild(taskItem);
    });
    
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = parseInt(this.dataset.id);
            completeTask(taskId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = parseInt(this.dataset.id);
            deleteTask(taskId);
        });
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            filterTasks(filter);
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function getCategoryName(category) {
    const categories = {
        'work': 'Работа',
        'study': 'Учеба',
        'sport': 'Спорт',
        'personal': 'Личное'
    };
    return categories[category] || category;
}

function getPriorityName(priority) {
    const priorities = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
    };
    return priorities[priority] || priority;
}

function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = true;
        tasks[taskIndex].completedAt = new Date().toISOString();
        saveTasks();
        renderTasks();
        showNotification('Задача завершена!', 'success');
    }
}

function deleteTask(taskId) {
    if (confirm('Удалить задачу?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        showNotification('Задача удалена', 'error');
    }
}

function filterTasks(filter) {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        const isCompleted = item.classList.contains('completed');
        
        switch(filter) {
            case 'all':
                item.style.display = 'block';
                break;
            case 'active':
                item.style.display = isCompleted ? 'none' : 'block';
                break;
            case 'completed':
                item.style.display = isCompleted ? 'block' : 'none';
                break;
        }
    });
}

function initProductivityCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    const inputFields = document.querySelectorAll('.activity-input input');
    const totalHoursDisplay = document.getElementById('totalHoursDisplay');
    
    function updateTotalHours() {
        let total = 0;
        inputFields.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        totalHoursDisplay.textContent = `${total}ч`;
    }
    
    inputFields.forEach(input => {
        input.addEventListener('input', updateTotalHours);
    });
    
    calculateBtn.addEventListener('click', function() {
        const workHours = parseFloat(document.getElementById('workHours').value) || 0;
        const studyHours = parseFloat(document.getElementById('studyHours').value) || 0;
        const sportHours = parseFloat(document.getElementById('sportHours').value) || 0;
        const restHours = parseFloat(document.getElementById('restHours').value) || 0;
        const entertainmentHours = parseFloat(document.getElementById('entertainmentHours').value) || 0;
        
        const productiveHours = workHours + studyHours + sportHours;
        const totalHours = workHours + studyHours + sportHours + restHours + entertainmentHours;
        
        let productivityPercent = 0;
        if (totalHours > 0) {
            productivityPercent = Math.round((productiveHours / totalHours) * 100);
        }
        
        document.getElementById('productivityPercent').textContent = `${productivityPercent}%`;
        
        updateChart([workHours, studyHours, sportHours, restHours, entertainmentHours]);
        
        showNotification(`Продуктивность: ${productivityPercent}%`, 'success');
    });
    
    updateTotalHours();
}

function updateChart(data) {
    const ctx = document.getElementById('productivityChart').getContext('2d');
    
    if (window.productivityChart) {
        window.productivityChart.destroy();
    }
    
    window.productivityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Работа', 'Учеба', 'Спорт', 'Отдых', 'Развлечения'],
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(0, 240, 255, 0.8)',
                    'rgba(157, 0, 255, 0.8)',
                    'rgba(0, 255, 136, 0.8)',
                    'rgba(255, 170, 0, 0.8)',
                    'rgba(255, 51, 102, 0.8)'
                ],
                borderColor: [
                    'rgba(0, 240, 255, 1)',
                    'rgba(157, 0, 255, 1)',
                    'rgba(0, 255, 136, 1)',
                    'rgba(255, 170, 0, 1)',
                    'rgba(255, 51, 102, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white',
                        font: {
                            family: "'Exo 2', sans-serif"
                        }
                    }
                }
            }
        }
    });
}

function initPomodoroTimer() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const skipBtn = document.getElementById('skipBtn');
    const workDurationInput = document.getElementById('workDuration');
    const breakDurationInput = document.getElementById('breakDuration');
    const longBreakDurationInput = document.getElementById('longBreakDuration');
    const timerCircle = document.getElementById('timerCircle');
    
    let totalTime = totalWorkTime;
    let circumference = 2 * Math.PI * 140;
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = ((totalTime - timeLeft) / totalTime) * circumference;
        timerCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        timerCircle.style.strokeDashoffset = circumference - progress;
    }
    
    function startTimer() {
        if (timerRunning) return;
        
        timerRunning = true;
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                
                if (timerMode === 'work') {
                    focusSessions++;
                    totalFocusTime += totalWorkTime / 60;
                    
                    if (focusSessions % 4 === 0) {
                        timerMode = 'longBreak';
                        timeLeft = parseInt(longBreakDurationInput.value) * 60;
                        document.getElementById('timerMode').querySelector('.mode-text').textContent = 'ДЛИННЫЙ ОТДЫХ';
                        showNotification('Время длинного перерыва!', 'warning');
                    } else {
                        timerMode = 'break';
                        timeLeft = totalBreakTime;
                        document.getElementById('timerMode').querySelector('.mode-text').textContent = 'ОТДЫХ';
                        showNotification('Время перерыва!', 'info');
                    }
                } else {
                    timerMode = 'work';
                    timeLeft = totalWorkTime;
                    document.getElementById('timerMode').querySelector('.mode-text').textContent = 'ФОКУС';
                    currentSession++;
                    document.getElementById('sessionCount').textContent = currentSession;
                    showNotification('Время работать!', 'success');
                }
                
                totalTime = timeLeft;
                updateTimerDisplay();
                updateFocusStats();
                playNotificationSound();
            }
        }, 1000);
    }
    
    function pauseTimer() {
        if (!timerRunning) return;
        
        clearInterval(timerInterval);
        timerRunning = false;
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerMode = 'work';
        timeLeft = totalWorkTime;
        totalTime = totalWorkTime;
        document.getElementById('timerMode').querySelector('.mode-text').textContent = 'ФОКУС';
        updateTimerDisplay();
    }
    
    function skipTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        
        if (timerMode === 'work') {
            focusSessions++;
            totalFocusTime += (totalWorkTime - timeLeft) / 60;
        }
        
        if (timerMode === 'work') {
            if (focusSessions % 4 === 0) {
                timerMode = 'longBreak';
                timeLeft = parseInt(longBreakDurationInput.value) * 60;
                document.getElementById('timerMode').querySelector('.mode-text').textContent = 'ДЛИННЫЙ ОТДЫХ';
            } else {
                timerMode = 'break';
                timeLeft = totalBreakTime;
                document.getElementById('timerMode').querySelector('.mode-text').textContent = 'ОТДЫХ';
            }
        } else {
            timerMode = 'work';
            timeLeft = totalWorkTime;
            document.getElementById('timerMode').querySelector('.mode-text').textContent = 'ФОКУС';
            currentSession++;
            document.getElementById('sessionCount').textContent = currentSession;
        }
        
        totalTime = timeLeft;
        updateTimerDisplay();
        updateFocusStats();
    }
    
    function updateTimerSettings() {
        totalWorkTime = parseInt(workDurationInput.value) * 60;
        totalBreakTime = parseInt(breakDurationInput.value) * 60;
        
        if (!timerRunning) {
            if (timerMode === 'work') {
                timeLeft = totalWorkTime;
                totalTime = totalWorkTime;
            }
            updateTimerDisplay();
        }
        
        localStorage.setItem('workDuration', workDurationInput.value);
        localStorage.setItem('breakDuration', breakDurationInput.value);
        localStorage.setItem('longBreakDuration', longBreakDurationInput.value);
    }
    
    function loadTimerSettings() {
        const savedWorkDuration = localStorage.getItem('workDuration');
        const savedBreakDuration = localStorage.getItem('breakDuration');
        const savedLongBreakDuration = localStorage.getItem('longBreakDuration');
        
        if (savedWorkDuration) {
            workDurationInput.value = savedWorkDuration;
            totalWorkTime = savedWorkDuration * 60;
        }
        
        if (savedBreakDuration) {
            breakDurationInput.value = savedBreakDuration;
            totalBreakTime = savedBreakDuration * 60;
        }
        
        if (savedLongBreakDuration) {
            longBreakDurationInput.value = savedLongBreakDuration;
        }
        
        resetTimer();
    }
    
    function updateFocusStats() {
        document.getElementById('focusSessions').textContent = focusSessions;
        document.getElementById('totalFocusTime').textContent = `${Math.round(totalFocusTime)}ч`;
        
        const today = new Date().toDateString();
        const lastSessionDate = localStorage.getItem('lastSessionDate');
        
        if (lastSessionDate === today) {
            focusStreak = parseInt(localStorage.getItem('focusStreak')) || 0;
        } else if (lastSessionDate === new Date(Date.now() - 86400000).toDateString()) {
            focusStreak = (parseInt(localStorage.getItem('focusStreak')) || 0) + 1;
        } else {
            focusStreak = 1;
        }
        
        localStorage.setItem('lastSessionDate', today);
        localStorage.setItem('focusStreak', focusStreak);
        
        document.getElementById('focusStreak').textContent = focusStreak;
        
        const focusScore = Math.round((focusSessions * 10) + (focusStreak * 5));
        document.getElementById('focusScore').textContent = focusScore;
    }
    
    function playNotificationSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    }
    
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    skipBtn.addEventListener('click', skipTimer);
    
    workDurationInput.addEventListener('change', updateTimerSettings);
    breakDurationInput.addEventListener('change', updateTimerSettings);
    longBreakDurationInput.addEventListener('change', updateTimerSettings);
    
    loadTimerSettings();
    updateTimerDisplay();
}

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const message = document.getElementById('contactMessage').value;
        
        if (!name || !email || !message) {
            showNotification('Заполните все поля', 'error');
            return;
        }
        
        const contactData = {
            name: name,
            email: email,
            message: message,
            date: new Date().toISOString()
        };
        
        let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
        contacts.push(contactData);
        localStorage.setItem('contacts', JSON.stringify(contacts));
        
        showNotification('Сообщение отправлено!', 'success');
        contactForm.reset();
    });
}

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        
        const spans = this.querySelectorAll('.menu-icon span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.main-nav') && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const spans = mobileMenuBtn.querySelectorAll('.menu-icon span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-times-circle' : 
                 type === 'warning' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="notification-content ${type}">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
    
    const style = document.createElement('style');
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 15px 20px;
                background: rgba(20, 30, 50, 0.95);
                border: 1px solid rgba(0, 240, 255, 0.3);
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }
            
            .notification-content.success {
                border-color: rgba(0, 255, 136, 0.5);
            }
            
            .notification-content.error {
                border-color: rgba(255, 51, 102, 0.5);
            }
            
            .notification-content.warning {
                border-color: rgba(255, 170, 0, 0.5);
            }
            
            .notification-content.info {
                border-color: rgba(0, 240, 255, 0.5);
            }
            
            .notification-content i {
                font-size: 20px;
            }
            
            .notification-content.success i {
                color: #00ff88;
            }
            
            .notification-content.error i {
                color: #ff3366;
            }
            
            .notification-content.warning i {
                color: #ffaa00;
            }
            
            .notification-content.info i {
                color: #00f0ff;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

document.getElementById('quickStart').addEventListener('click', function() {
    showNotification('Быстрый старт активирован!', 'success');
});

document.getElementById('demoMode').addEventListener('click', function() {
    showNotification('Демо режим активирован!', 'info');
});

const tabButtons = document.querySelectorAll('.tab-btn');
tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const tabId = this.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.getElementById(tabId).classList.add('active');
    });
});