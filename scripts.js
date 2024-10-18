document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const progressBar = document.querySelector('.progress');
    const quoteElement = document.getElementById('motivational-quote');

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

    // Progress bar update
    function updateProgress() {
        const total = checkboxes.length;
        const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
        const percentage = (checked / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${Math.round(percentage)}%`;

        // Save checkbox states
        const checkboxStates = Array.from(checkboxes).map(cb => cb.checked);
        localStorage.setItem('checkboxStates', JSON.stringify(checkboxStates));
    }

    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', updateProgress);

        // Load saved checkbox states
        const savedStates = JSON.parse(localStorage.getItem('checkboxStates'));
        if (savedStates && savedStates[index] !== undefined) {
            checkbox.checked = savedStates[index];
        }
    });

    // Initial progress update
    updateProgress();

    // Motivational quotes
    const quotes = [
        "지금 행동하라! 내일은 없다!",
        "게으름은 적이다! 즉시 물리쳐라!",
        "한 번 더 노력하면 성공이 기다린다!",
        "포기는 실패의 지름길이다! 계속 나아가라!",
        "당신의 미래는 지금 만들어진다! 행동하라!",
        "성공은 선택이다! 지금 선택하라!",
        "불가능은 없다! 당장 도전하라!",
        "핑계는 그만! 지금 시작하라!",
        "실패는 성공의 어머니다! 두려워하지 말고 도전하라!",
        "당신은 할 수 있다! 지금 증명하라!"
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
});