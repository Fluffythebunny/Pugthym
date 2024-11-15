const achievements = {
    noteStreak: {
        name: 'Note Streak Master',
        description: 'Hit 100 notes in a row',
        requirement: 100,
        unlocked: false
    },
    comboMaster: {
        name: 'Combo Master',
        description: 'Reach a 500x combo',
        requirement: 500,
        unlocked: false
    },
    perfectAccuracy: {
        name: 'Perfect Accuracy',
        description: 'Complete a song with 100% accuracy',
        requirement: 100,
        unlocked: false
    }
};

function checkAchievements(stats) {
    if (stats.combo >= achievements.comboMaster.requirement && !achievements.comboMaster.unlocked) {
        unlockAchievement('comboMaster');
    }
    
    if (stats.accuracy >= achievements.perfectAccuracy.requirement && !achievements.perfectAccuracy.unlocked) {
        unlockAchievement('perfectAccuracy');
    }
}

function unlockAchievement(id) {
    achievements[id].unlocked = true;
    saveAchievements();
    showAchievementNotification(achievements[id].name);
}

function showAchievementNotification(name) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <span class="achievement-icon">🏆</span>
        <div class="achievement-text">
            <div>Achievement Unlocked!</div>
            <div>${name}</div>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

function saveAchievements() {
    localStorage.setItem('rhythmGameAchievements', JSON.stringify(achievements));
}

function loadAchievements() {
    const saved = localStorage.getItem('rhythmGameAchievements');
    if (saved) {
        Object.assign(achievements, JSON.parse(saved));
    }
}
