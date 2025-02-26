let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let links = JSON.parse(localStorage.getItem('links')) || [];
let incomes = JSON.parse(localStorage.getItem('incomes')) || [];

function renderLinks() {
    const container = document.getElementById('linksContainer');
    container.innerHTML = '';
    
    // Sort links: pinned first, then by timestamp
    const sortedLinks = [...links].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.timestamp - a.timestamp;
    });
    
    sortedLinks.forEach((link, index) => {
        const card = document.createElement('div');
        card.className = 'link-card';
        
        // Generate a unique placeholder with the site's favicon if no image is provided
        const defaultImage = link.image || `https://www.google.com/s2/favicons?domain=${link.url}&sz=64`;
        
        card.innerHTML = `
            <button class="pin-button ${link.pinned ? 'pinned' : ''}" onclick="togglePin(${index}, event)" title="Pin link">
                <i class="fas fa-thumbtack"></i>
            </button>
            <button class="delete-button" onclick="deleteLink(${index}, event)" title="Delete link">
                <i class="fas fa-times"></i>
            </button>
            <img src="${defaultImage}" alt="${link.title}" class="link-image" 
                onerror="this.src='https://via.placeholder.com/300x180/0ea5e9/FFFFFF?text=${encodeURIComponent(link.title)}'">
            <div class="link-content">
                <h3 class="link-title">${link.title}</h3>
                <p class="link-url">${new URL(link.url).hostname}</p>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                window.open(link.url, '_blank');
            }
        });
        
        container.appendChild(card);
    });

    // Update dashboard stats
    updateDashboardStats();
}

function addLink() {
    const title = document.getElementById('linkTitle').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const image = document.getElementById('linkImage').value.trim();
    
    if (!title || !url) return;
    
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
    }
    
    links.push({ 
        title, 
        url: formattedUrl,
        image: image || null,
        timestamp: Date.now()
    });
    
    localStorage.setItem('links', JSON.stringify(links));
    
    document.getElementById('linkTitle').value = '';
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkImage').value = '';
    
    renderLinks();
}

function deleteLink(index) {
    links.splice(index, 1);
    localStorage.setItem('links', JSON.stringify(links));
    renderLinks();
}

// Tab Navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // Hide all tab contents initially except the first one
    tabContents.forEach((content, index) => {
        if (index === 0) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(`${tabId}-tab`);
            if (tabContent) {
                tabContent.classList.add('active');

                // Handle special cases for each tab
                switch (tabId) {
                    case 'expenses':
                        if (expenseChart) {
                            expenseChart.destroy();
                        }
                        initExpenseChart();
                        updateExpenseStats();
                        renderExpenses();
                        break;
                    case 'weather':
                        getWeather('Bagalkot');
                        break;
                    case 'links':
                        renderLinks();
                        break;
                }
            }
        });
    });
}

// Add global variables
let expenseChart = null;
let incomeChart = null;

// Initialize expense chart
function initExpenseChart() {
    if (expenseChart) {
        expenseChart.destroy();
    }
    if (incomeChart) {
        incomeChart.destroy();
    }

    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#6366f1', // Primary
                    '#10b981', // Success
                    '#f59e0b', // Warning
                    '#ef4444', // Danger
                    '#3b82f6', // Info
                    '#8b5cf6', // Purple
                    '#ec4899', // Pink
                    '#14b8a6', // Teal
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: {
                    top: 10,
                    bottom: 40,
                    left: 20,
                    right: 20
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'var(--text-secondary)',
                        padding: 10,
                        usePointStyle: true,
                        boxWidth: 8,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
    
    // Initialize income chart
    const incomeCtx = document.getElementById('incomeChart');
    if (!incomeCtx) return;
    
    incomeChart = new Chart(incomeCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#10b981', // Green
                    '#3b82f6', // Blue
                    '#8b5cf6', // Purple
                    '#f59e0b', // Orange
                    '#6366f1', // Indigo
                ],
                borderWidth: 2,
                borderColor: 'var(--bg-primary)',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: {
                    top: 10,
                    bottom: 40,
                    left: 20,
                    right: 20
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'var(--text-secondary)',
                        padding: 10,
                        usePointStyle: true,
                        boxWidth: 8,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });

    updateCharts();
}

// Main initialization function
function initializeApp() {
    // Initialize data
    expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    links = JSON.parse(localStorage.getItem('links')) || [];
    incomes = JSON.parse(localStorage.getItem('incomes')) || [];

    // Initialize UI
    initializeTabs();
    renderLinks();
    updateDashboardStats();
    renderQuickCities();

    // Initialize forms
    const addLinkForm = document.getElementById('addLinkForm');
    const expenseForm = document.getElementById('expenseForm');
    if (addLinkForm) addLinkForm.style.display = 'none';
    if (expenseForm) expenseForm.style.display = 'none';

    // Initialize first tab content
    const firstTab = document.querySelector('.nav-item.active');
    if (firstTab) {
        const tabId = firstTab.getAttribute('data-tab');
        if (tabId === 'expenses') {
            initExpenseChart();
            updateExpenseStats();
            renderExpenses();
        }
    }

    if (document.querySelector('.nav-item.active').getAttribute('data-tab') === 'expenses') {
        initializeCharts();
        updateExpenseStats();
        // Don't render transactions initially
        document.getElementById('transactionsList').classList.remove('show');
    }
}

// Make sure we initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Add dark mode toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button text
    const themeText = document.querySelector('.theme-toggle span');
    themeText.style.opacity = '0';
    setTimeout(() => {
        themeText.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
        themeText.style.opacity = '1';
    }, 200);
});

// Add new function to update dashboard stats
function updateDashboardStats() {
    // Update total links count
    document.getElementById('totalLinks').textContent = links.length;

    // Update monthly expenses in dashboard
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTotal = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    document.getElementById('monthExpenses').textContent = `₹${monthlyTotal.toFixed(2)}`;
}

// Expense Tracker
function updateExpenseChart() {
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    // Sort categories by amount
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .reduce((acc, [category, amount]) => {
            acc[category] = amount;
            return acc;
        }, {});

    expenseChart.data.labels = Object.keys(sortedCategories);
    expenseChart.data.datasets[0].data = Object.values(sortedCategories);
    expenseChart.update();
}

function updateExpenseStats() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Current Month Stats
    const monthlyIncome = incomes
        .filter(income => new Date(income.date).getMonth() === currentMonth)
        .reduce((sum, income) => sum + income.amount, 0);
        
    const monthlyExpenses = expenses
        .filter(expense => new Date(expense.date).getMonth() === currentMonth)
        .reduce((sum, expense) => sum + expense.amount, 0);
        
    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    // Last Month Stats
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthIncome = incomes
        .filter(income => {
            const date = new Date(income.date);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        })
        .reduce((sum, income) => sum + income.amount, 0);
        
    const lastMonthExpenses = expenses
        .filter(expense => {
            const date = new Date(expense.date);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
        
    const lastMonthSavings = lastMonthIncome - lastMonthExpenses;
    
    // Current Year Stats
    const yearlyIncome = incomes
        .filter(income => new Date(income.date).getFullYear() === currentYear)
        .reduce((sum, income) => sum + income.amount, 0);
        
    const yearlyExpenses = expenses
        .filter(expense => new Date(expense.date).getFullYear() === currentYear)
        .reduce((sum, expense) => sum + expense.amount, 0);
        
    const yearlySavings = yearlyIncome - yearlyExpenses;
    
    // Last Year Stats
    const lastYear = currentYear - 1;
    const lastYearIncome = incomes
        .filter(income => new Date(income.date).getFullYear() === lastYear)
        .reduce((sum, income) => sum + income.amount, 0);
        
    const lastYearExpenses = expenses
        .filter(expense => new Date(expense.date).getFullYear() === lastYear)
        .reduce((sum, expense) => sum + expense.amount, 0);
        
    const lastYearSavings = lastYearIncome - lastYearExpenses;
    
    // Update UI
    document.getElementById('monthlyIncome').textContent = `₹${monthlyIncome.toFixed(2)}`;
    document.getElementById('monthlyExpenses').textContent = `₹${monthlyExpenses.toFixed(2)}`;
    document.getElementById('monthlySavings').textContent = `₹${monthlySavings.toFixed(2)}`;
    document.getElementById('lastMonthSavings').textContent = `₹${lastMonthSavings.toFixed(2)}`;
    
    document.getElementById('yearlyIncome').textContent = `₹${yearlyIncome.toFixed(2)}`;
    document.getElementById('yearlyExpenses').textContent = `₹${yearlyExpenses.toFixed(2)}`;
    document.getElementById('yearlySavings').textContent = `₹${yearlySavings.toFixed(2)}`;
    document.getElementById('lastYearSavings').textContent = `₹${lastYearSavings.toFixed(2)}`;
    
    // Add color classes
    document.getElementById('monthlySavings').className = monthlySavings >= 0 ? 'savings-positive' : 'savings-negative';
    document.getElementById('lastMonthSavings').className = lastMonthSavings >= 0 ? 'savings-positive' : 'savings-negative';
    document.getElementById('yearlySavings').className = yearlySavings >= 0 ? 'savings-positive' : 'savings-negative';
    document.getElementById('lastYearSavings').className = lastYearSavings >= 0 ? 'savings-positive' : 'savings-negative';
}

// Initialize expense form as hidden
document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.style.display = 'none';
    }
});

// Update showAddExpenseForm function
function showAddExpenseForm() {
    const form = document.getElementById('expenseForm');
    if (!form) return;
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        document.getElementById('expenseTitle').focus();
    } else {
        form.style.display = 'none';
    }
}

// Update addExpense function to fix the expense tracker
function addExpense() {
    const title = document.getElementById('expenseTitle').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const date = document.getElementById('expenseDate').value;

    if (!title || isNaN(amount) || !category || !paymentMode || !date) {
        alert('Please fill in all fields correctly');
        return;
    }

    const newExpense = {
        title,
        amount,
        category,
        paymentMode,
        date,
        timestamp: Date.now()
    };

    expenses.push(newExpense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // Update all relevant displays
    updateExpenseChart();
    updateExpenseStats();
    renderExpenses();
    updateDashboardStats(); // Update dashboard stats too
    updateCharts();

    // Reset and hide form
    document.getElementById('expenseTitle').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseCategory').value = '';
    document.getElementById('paymentMode').value = '';
    document.getElementById('expenseDate').value = '';
    document.getElementById('expenseForm').style.display = 'none';
}

// Weather functionality
const WEATHER_API_KEY = 'c8d7a7c25bdb47edadd122122252602';

async function getWeather(city) {
    const cityInput = document.getElementById('cityInput');
    const cityName = city || cityInput.value;
    
    if (!cityName) return;

    try {
        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${cityName}`);
        const data = await response.json();

        if (data.error) {
            alert('City not found. Please try again.');
            return;
        }

        updateWeatherUI(data);
        if (cityInput) cityInput.value = '';
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        alert('Failed to fetch weather data. Please try again.');
    }
}

function updateWeatherUI(data) {
    const elements = {
        temperature: document.getElementById('temperature'),
        cityName: document.getElementById('cityName'),
        weatherDesc: document.getElementById('weatherDesc'),
        humidity: document.getElementById('humidity'),
        windSpeed: document.getElementById('windSpeed'),
        feelsLike: document.getElementById('feelsLike'),
        weatherIcon: document.getElementById('weatherIcon')
    };

    // Add fade out effect
    Object.values(elements).forEach(el => {
        if (el) el.style.opacity = '0';
    });

    // Update values and fade in after a short delay
    setTimeout(() => {
        elements.temperature.textContent = `${Math.round(data.current.temp_c)}°C`;
        elements.cityName.textContent = data.location.name;
        elements.weatherDesc.textContent = data.current.condition.text;
        elements.humidity.textContent = `${data.current.humidity}%`;
        elements.windSpeed.textContent = `${Math.round(data.current.wind_kph)} km/h`;
        elements.feelsLike.textContent = `${Math.round(data.current.feelslike_c)}°C`;
        elements.weatherIcon.src = `https:${data.current.condition.icon}`;

        // Fade in elements
        Object.values(elements).forEach(el => {
            if (el) {
                el.style.opacity = '1';
                el.style.transition = 'opacity 0.3s ease';
            }
        });
    }, 300);
}

// Enhanced expense tracker
function renderExpenses() {
    const list = document.getElementById('expenseList');
    list.innerHTML = '';

    expenses.sort((a, b) => b.timestamp - a.timestamp).forEach((expense, index) => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.innerHTML = `
            <div class="expense-info">
                <h4>${expense.title}</h4>
                <div class="expense-meta">
                    <span>${expense.category}</span>
                    <span>${expense.paymentMode}</span>
                    <span>${new Date(expense.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
            <button class="action-btn" onclick="editExpense(${index})" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn" onclick="deleteExpense(${index})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

function deleteExpense(index) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses.splice(index, 1);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        // Update all displays
        updateExpenseChart();
        updateExpenseStats();
        renderExpenses();
        updateDashboardStats();
    }
}

function editExpense(index) {
    const expense = expenses[index];
    document.getElementById('expenseTitle').value = expense.title;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('paymentMode').value = expense.paymentMode;
    document.getElementById('expenseDate').value = expense.date;
    
    expenses.splice(index, 1);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateExpenseChart();
    updateExpenseStats();
    renderExpenses();
}

// Pin feature for links
function togglePin(index, event) {
    event.stopPropagation();
    links[index].pinned = !links[index].pinned;
    localStorage.setItem('links', JSON.stringify(links));
    renderLinks();
}

// Reset function for expenses
function confirmReset() {
    if (confirm('Are you sure you want to reset all expense data? This cannot be undone.')) {
        expenses = [];
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpenseChart();
        updateExpenseStats();
        renderExpenses();
    }
}

// Enhanced weather functionality
const popularCities = [
    'Bagalkot',
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai'
];

function renderQuickCities() {
    const container = document.querySelector('.quick-cities');
    container.innerHTML = popularCities.map(city => 
        `<button onclick="getWeather('${city}')">${city}</button>`
    ).join('');
}

// Add function to toggle add link form visibility
function showAddLinkForm() {
    const form = document.getElementById('addLinkForm');
    if (!form) return;
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        document.getElementById('linkTitle').focus();
    } else {
        form.style.display = 'none';
    }
}

// Add function to export expenses to CSV
function exportToCSV() {
    if (expenses.length === 0) {
        alert('No expenses to export');
        return;
    }

    // Format the data
    const headers = ['Date', 'Title', 'Amount', 'Category', 'Payment Mode'];
    const rows = expenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.title,
        expense.amount,
        expense.category,
        expense.paymentMode
    ]);

    // Add total row
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    rows.push(['', 'Total', total, '', '']);

    // Convert to CSV format
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add income array
function showAddIncomeForm() {
    const form = document.getElementById('incomeForm');
    if (!form) return;
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        document.getElementById('incomeTitle').focus();
    } else {
        form.style.display = 'none';
    }
}

function addIncome() {
    const title = document.getElementById('incomeTitle').value.trim();
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const date = document.getElementById('incomeDate').value;
    const category = document.getElementById('incomeCategory').value;
    
    if (!title || !amount || !date || !category) {
        alert('Please fill all fields');
        return;
    }
    
    incomes.push({
        title,
        amount,
        date,
        category,
        timestamp: Date.now()
    });
    
    localStorage.setItem('incomes', JSON.stringify(incomes));
    
    // Clear form
    document.getElementById('incomeTitle').value = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('incomeDate').value = '';
    document.getElementById('incomeCategory').value = '';
    
    // Hide form
    document.getElementById('incomeForm').style.display = 'none';
    
    // Update UI
    updateExpenseStats();
    updateCharts();
    renderTransactions();
}

function renderIncomes() {
    const list = document.getElementById('expenseList');
    list.innerHTML = '<h3>Income</h3>';
    
    incomes.sort((a, b) => b.timestamp - a.timestamp).forEach((income, index) => {
        const item = document.createElement('div');
        item.className = 'income-item';
        item.innerHTML = `
            <div class="income-info">
                <h4>${income.title}</h4>
                <div class="income-meta">
                    <span>${income.category}</span>
                    <span>${new Date(income.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="income-amount">+₹${income.amount.toFixed(2)}</div>
            <button class="action-btn" onclick="deleteIncome(${index})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
        list.appendChild(item);
    });
    
    // Add expenses after income
    list.innerHTML += '<h3>Expenses</h3>';
    renderExpenses();
}

// Update toggle transactions function
function toggleTransactions() {
    const list = document.getElementById('transactionsList');
    const btn = document.querySelector('.toggle-btn');
    
    if (list.classList.contains('show')) {
        list.classList.remove('show');
        btn.innerHTML = '<i class="fas fa-list"></i> Show Transactions';
    } else {
        list.classList.add('show');
        btn.innerHTML = '<i class="fas fa-times"></i> Hide Transactions';
        renderTransactions();
    }
}

function renderTransactions() {
    const list = document.getElementById('transactionsList');
    if (!list) return;
    
    list.innerHTML = '<h3>Recent Transactions</h3>';
    
    // Combine and sort all transactions
    const allTransactions = [
        ...incomes.map(income => ({
            ...income,
            type: 'income'
        })),
        ...expenses.map(expense => ({
            ...expense,
            type: 'expense'
        }))
    ].sort((a, b) => b.timestamp - a.timestamp);
    
    allTransactions.forEach((transaction, index) => {
        const item = document.createElement('div');
        item.className = transaction.type === 'income' ? 'income-item' : 'expense-item';
        
        item.innerHTML = `
            <div class="transaction-info">
                <h4>${transaction.title}</h4>
                <div class="transaction-meta">
                    <span>${transaction.category}</span>
                    <span>${new Date(transaction.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type === 'income' ? 'income-amount' : 'expense-amount'}">
                ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
            </div>
            <button class="action-btn" onclick="${transaction.type}Delete(${index})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        list.appendChild(item);
    });
}

function updateCharts() {
    if (!expenseChart || !incomeChart) return;
    
    // Update expense chart
    const expensesByCategory = {};
    expenses.forEach(expense => {
        expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
    });
    
    expenseChart.data.labels = Object.keys(expensesByCategory);
    expenseChart.data.datasets[0].data = Object.values(expensesByCategory);
    expenseChart.update();
    
    // Update income chart
    const incomeByCategory = {};
    incomes.forEach(income => {
        incomeByCategory[income.category] = (incomeByCategory[income.category] || 0) + income.amount;
    });
    
    incomeChart.data.labels = Object.keys(incomeByCategory);
    incomeChart.data.datasets[0].data = Object.values(incomeByCategory);
    incomeChart.update();
} 