
document.addEventListener('DOMContentLoaded', function() {
    setupModalHandlers();
    
    // Инициализация UI Kit компонентов, если необходимо
    if (typeof UIkit !== 'undefined') {
        UIkit.use(Icons);
    }
});
