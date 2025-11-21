// تكوين Web3 والعقد الذكي
const CONTRACT_ADDRESS = '0x2c66e2a060549598f665098c6905418dbb438cec';
const TOKEN_PRICE = 0.000001; // 1 NEXUS = 0.000001 ETH
const TOKENS_PER_ETH = 1000000; // 1 ETH = 1,000,000 NEXUS

let web3;
let account;
let contract;

// ABI مبسط للعقد الذكي (يجب استبداله بالـ ABI الحقيقي)
const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "buyTokens",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "presaleRaised",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "tokenBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    await initApp();
    setupEventListeners();
    updatePresaleProgress();
});

// تهيئة Web3 والتطبيق
async function initApp() {
    // تحقق من وجود Web3 (MetaMask/Trust Wallet)
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
            // طلب الاتصال بالمحفظة
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) {
                account = accounts[0];
                await setupContract();
                await updateWalletInfo();
            }
        } catch (error) {
            console.error('User denied account access:', error);
        }
    } else {
        showError('Please install MetaMask or Trust Wallet to use this dApp!');
    }
}

// إعداد العقد الذكي
async function setupContract() {
    contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر توصيل المحفظة
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    
    // زر شراء التوكينز
    document.getElementById('buyTokens').addEventListener('click', buyTokens);
    
    // تحديث كمية NEXUS عند تغيير كمية ETH
    document.getElementById('ethAmount').addEventListener('input', updateNexusAmount);
    
    // تحديث واجهة المستخدم عند تغيير الحساب
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length > 0) {
                account = accounts[0];
                await updateWalletInfo();
            } else {
                disconnectWallet();
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }
}

// توصيل المحفظة
async function connectWallet() {
    try {
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        account = accounts[0];
        await updateWalletInfo();
        
        showSuccess('Wallet connected successfully!');
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError('Failed to connect wallet. Please try again.');
    }
}

// تحديث معلومات المحفظة
async function updateWalletInfo() {
    if (account && web3) {
        // تحديث واجهة المحفظة
        document.getElementById('connectWallet').innerHTML = 
            `<i class="fas fa-wallet"></i>${account.slice(0, 6)}...${account.slice(-4)}`;
        document.getElementById('connectWallet').classList.add('connected');
        
        document.getElementById('walletStatus').textContent = 'Connected';
        document.getElementById('walletStatus').classList.add('connected');
        
        document.getElementById('buyTokens').innerHTML = 
            `<i class="fas fa-shopping-cart"></i>Buy NEXUS Tokens`;
        document.getElementById('buyTokens').classList.add('connected');
        document.getElementById('buyTokens').disabled = false;
        
        // الحصول على رصيد ETH
        const balance = await web3.eth.getBalance(account);
        const ethBalance = web3.utils.fromWei(balance, 'ether');
        document.getElementById('ethBalance').textContent = `Balance: ${parseFloat(ethBalance).toFixed(4)} ETH`;
        
    } else {
        disconnectWallet();
    }
}

// فصل المحفظة
function disconnectWallet() {
    account = null;
    document.getElementById('connectWallet').innerHTML = 
        `<i class="fas fa-wallet"></i>Connect Wallet`;
    document.getElementById('connectWallet').classList.remove('connected');
    
    document.getElementById('walletStatus').textContent = 'Not Connected';
    document.getElementById('walletStatus').classList.remove('connected');
    
    document.getElementById('buyTokens').innerHTML = 
        `<i class="fas fa-shopping-cart"></i>Connect Wallet to Buy`;
    document.getElementById('buyTokens').classList.remove('connected');
    document.getElementById('buyTokens').disabled = true;
    
    document.getElementById('ethBalance').textContent = 'Balance: 0 ETH';
}

// تحديث كمية NEXUS
function updateNexusAmount() {
    const ethAmount = parseFloat(document.getElementById('ethAmount').value);
    
    if (!isNaN(ethAmount) && ethAmount > 0) {
        const nexusAmount = ethAmount * TOKENS_PER_ETH;
        document.getElementById('nexusAmount').value = nexusAmount.toLocaleString();
    } else {
        document.getElementById('nexusAmount').value = '0';
    }
}

// شراء التوكينز
async function buyTokens() {
    if (!account) {
        showError('Please connect your wallet first!');
        return;
    }
    
    const ethAmount = document.getElementById('ethAmount').value;
    const ethWei = web3.utils.toWei(ethAmount, 'ether');
    
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
        showError('Please enter a valid ETH amount!');
        return;
    }
    
    if (parseFloat(ethAmount) < 0.01) {
        showError('Minimum purchase is 0.01 ETH!');
        return;
    }
    
    if (parseFloat(ethAmount) > 10) {
        showError('Maximum purchase is 10 ETH!');
        return;
    }
    
    try {
        document.getElementById('buyTokens').disabled = true;
        document.getElementById('buyTokens').innerHTML = 
            `<i class="fas fa-spinner fa-spin"></i>Processing...`;
        
        // إرسال المعاملة
        const transaction = await contract.methods.buyTokens().send({
            from: account,
            value: ethWei,
            gas: 300000
        });
        
        showSuccess(`Success! Transaction hash: ${transaction.transactionHash}`);
        
        // تحديث الواجهة
        await updateWalletInfo();
        await updatePresaleProgress();
        
    } catch (error) {
        console.error('Error buying tokens:', error);
        showError('Transaction failed! Please try again.');
    } finally {
        document.getElementById('buyTokens').disabled = false;
        document.getElementById('buyTokens').innerHTML = 
            `<i class="fas fa-shopping-cart"></i>Buy NEXUS Tokens`;
    }
}

// تحديث تقدم الاكتتاب
async function updatePresaleProgress() {
    if (contract) {
        try {
            const raised = await contract.methods.presaleRaised().call();
            const raisedETH = web3.utils.fromWei(raised, 'ether');
            const progress = (parseFloat(raisedETH) / 500) * 100;
            
            document.getElementById('raisedAmount').textContent = `${parseFloat(raisedETH).toFixed(2)} ETH`;
            document.getElementById('presaleProgress').style.width = `${Math.min(progress, 100)}%`;
            
        } catch (error) {
            console.error('Error fetching presale progress:', error);
        }
    }
}

// نسخ عنوان العقد
function copyContractAddress() {
    navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => {
        showSuccess('Contract address copied to clipboard!');
    }).catch(() => {
        showError('Failed to copy address!');
    });
}

// رسائل النجاح
function showSuccess(message) {
    showNotification(message, 'success');
}

// رسائل الخطأ
function showError(message) {
    showNotification(message, 'error');
}

// عرض الإشعارات
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إضافة أنماط الإشعار
    if (!document.querySelector('.notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                border-left: 4px solid var(--accent-color);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            
            .notification.error {
                border-left-color: var(--error-color);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .notification.success i {
                color: var(--accent-color);
            }
            
            .notification.error i {
                color: var(--error-color);
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // إزالة الإشعار بعد 5 ثواني
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// تهيئة مخطط التوكينومكس
function initTokenomicsChart() {
    const ctx = document.getElementById('tokenomicsChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Presale', 'Liquidity', 'Team & Development', 'Marketing'],
            datasets: [{
                data: [50, 30, 10, 10],
                backgroundColor: [
                    '#7c3aed',
                    '#06b6d4',
                    '#10b981',
                    '#f59e0b'
                ],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

// تهيئة المخطط عند تحميل الصفحة
window.addEventListener('load', initTokenomicsChart);

// تأثيرات التمرير
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

console.log('🚀 NEXUS Token Presale dApp Loaded Successfully!');