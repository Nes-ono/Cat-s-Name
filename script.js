// 配置
const CONFIG = {
    // 拼音转换API地址（如果后端服务运行在不同端口，请修改此处）
    PINYIN_API_URL: 'http://localhost:3000/api/convert',
    // 是否启用拼音转换API（如果后端未运行，设置为false将使用备用方法）
    ENABLE_PINYIN_API: true
};

// 状态管理
let state = {
    step: -1, // -1: 等待播放, 0: 已播放等待开始, 1: 第一次点击后, 2: 显示按钮, 3: 语音识别中, 4: 松开后等待确认, 5: 物品选择, 6: 拖拽后, 7: 名片页
    wordCount: 0,
    tone: 0,
    category: '',
    recognitionCompleted: false, // 识别是否完成
    frontImageName: '',
    backImageName: ''
};

// DOM元素
const video = document.getElementById('main-video');
const videoContainer = document.getElementById('video-container');
const overlay = document.getElementById('overlay');
const textDisplay = document.getElementById('text-display');
const callButton = document.getElementById('call-button');
const itemBar = document.getElementById('item-bar');
const animationPlaceholder = document.getElementById('animation-placeholder');
const cardPage = document.getElementById('card-page');
const cardContainer = document.getElementById('card-container');
const saveButton = document.getElementById('save-button');
const restartButton = document.getElementById('restart-button');
const recognitionResult = document.getElementById('recognition-result');
const bgmAudio = document.getElementById('bgm-audio');

// 背景音乐配置
const BGM_CONFIG = {
    normalVolume: 0.5, // 正常音量
    lowVolume: 0.1     // 语音识别时的低音量
};

// 文字内容
const texts = {
    step1: "草丛里藏着一只小毛球～ 它在等一个特别的声音呢！随便喊点什么都行，它说不定就出来啦～",
    step2: "它听到你啦！好像对你的声音很感兴趣～ 不过有点害羞，拿个小礼物哄哄它吧！",
    step3: "太好啦！它喜欢你的声音和礼物～ 这只校园里的小可爱，终于愿意和你见面啦！"
};

// 声调映射
const TONE_NAME_MAP = {
    1: '一声',
    2: '二声',
    3: '三声',
    4: '四声'
};

// 前景图映射（字数-声调-分类 -> 名称）
const FRONT_IMAGE_MAP = {
    '2-一声-a': '海参',
    '2-一声-b': '警花',
    '2-一声-c': '小灰',
    '2-二声-a': '青提',
    '2-二声-b': '煤球',
    '2-二声-c': '蛋白',
    '2-三声-a': '芒果',
    '2-三声-b': '警长',
    '2-三声-c': '墨染',
    '2-四声-a': '糖蒜',
    '2-四声-b': '手套',
    '2-四声-c': '黄豆',
    '3-一声-a': '麦乐鸡',
    '3-一声-b': '脏脏包',
    '3-一声-c': '奶黄包',
    '3-二声-a': '黑芝麻',
    '3-二声-b': '大眼橘',
    '3-二声-c': '橘多白',
    '3-三声-a': '虾小饺',
    '3-三声-b': '斜刘海',
    '3-三声-c': '黑黝黝',
    '3-四声-a': '热干面',
    '3-四声-b': '长短袜',
    '3-四声-c': '黑老大',
    '4-一声-a': '黄瓜妈妈',
    '4-一声-b': '奶牛包',
    '4-一声-c': '橘白猫妈',
    '4-二声-a': '芝麻奶黄',
    '4-二声-b': '银角大王',
    '4-二声-c': '伊丽莎白',
    '4-三声-a': '豆粉麻薯',
    '4-三声-b': '民地中海',
    '4-三声-c': '小黑学姐',
    '4-四声-a': '玉米二号',
    '4-四声-b': '民梅菜干',
    '4-四声-c': '黑布木妹'
};

// 背面图映射（前景名称 -> 反面名称）
const BACK_IMAGE_MAP = {
    '海参': '狸花猫',
    '手套': '狸花猫',
    '民梅菜干': '狸花猫',
    '民梅干菜': '狸花猫',
    '民地中海': '狸花猫',
    '银角大王': '狸花猫',
    '小灰': '狸花猫',
    '断尾狸花': '狸花猫',
    '大眼橘': '橘猫',
    '虾小饺': '橘猫',
    '蛋黄': '橘猫',
    '橘多白': '橘猫',
    '奶黄包': '橘猫',
    '长短袜': '橘猫',
    '橘白猫妈': '橘猫',
    '芒果': '橘猫',
    '热干面': '橘猫',
    '玉米二号': '橘猫',
    '黄豆': '橘猫',
    '麦乐鸡': '三花猫',
    '警花': '三花猫',
    '芝麻奶黄': '三花猫',
    '黄瓜妈妈': '白猫',
    '伊丽莎白': '白猫',
    '黑黝黝': '黑猫',
    '煤球': '黑猫',
    '小黑学姐': '黑猫',
    '黑布木妹': '黑猫',
    '青提': '奶牛猫',
    '黑芝麻': '奶牛猫',
    '警长': '奶牛猫',
    '斜刘海': '奶牛猫',
    '糖蒜': '奶牛猫',
    '黑老大': '奶牛猫',
    '墨染': '奶牛猫',
    '脏脏包': '玳瑁',
    '豆粉麻薯': '玳瑁'
};

// 名片名称到视频文件的映射（根据识别到的名片名称播放对应的MP4文件）
const NAME_TO_VIDEO_MAP = {
    // 狸花猫
    '海参': '狸花猫.mp4',
    '手套': '狸花猫.mp4',
    '民梅干菜': '狸花猫.mp4',
    '民地中海': '狸花猫.mp4',
    '银角大王': '狸花猫.mp4',
    '小灰': '狸花猫.mp4',
    '断尾狸花': '狸花猫.mp4',
    // 橘猫
    '大眼橘': '橘猫.mp4',
    '虾小饺': '橘猫.mp4',
    '蛋黄': '橘猫.mp4',
    '橘多白': '橘猫.mp4',
    '奶黄包': '橘猫.mp4',
    '长短袜': '橘猫.mp4',
    '橘白猫妈': '橘猫.mp4',
    '芒果': '橘猫.mp4',
    '热干面': '橘猫.mp4',
    '玉米二号': '橘猫.mp4',
    '黄豆': '橘猫.mp4',
    // 三花猫
    '麦乐鸡': '三花猫.mp4',
    '警花': '三花猫.mp4',
    '芝麻奶黄': '三花猫.mp4',
    // 白猫
    '黄瓜妈妈': '白猫.mp4',
    '伊丽莎白': '白猫.mp4',
    // 黑猫
    '黑黝黝': '黑猫.mp4',
    '煤球': '黑猫.mp4',
    '小黑学姐': '黑猫.mp4',
    '黑布木妹': '黑猫.mp4',
    // 奶牛猫
    '青提': '奶牛猫.mp4',
    '黑芝麻': '奶牛猫.mp4',
    '警长': '奶牛猫.mp4',
    '斜刘海': '奶牛猫.mp4',
    '糖蒜': '奶牛猫.mp4',
    '黑老大': '奶牛猫.mp4',
    '墨染': '奶牛猫.mp4',
    // 玳瑁
    '脏脏包': '玳瑁.mp4',
    '豆粉麻薯': '玳瑁.mp4'
};

// 构建图像键
function buildImageKey(wordCount, tone, category) {
    const toneName = TONE_NAME_MAP[tone] || '一声';
    return `${wordCount}-${toneName}-${category}`;
}

// 根据名称为图片元素设置路径，优先使用png格式
function setImageWithFallback(imgElement, basePath, name) {
    if (!imgElement || !name) {
        return;
    }
    const pngPath = `${basePath}/${name}.png`;
    const jpgPath = `${basePath}/${name}.jpg`;

    // 清理之前的处理
    imgElement.dataset.fallbackTried = 'false';
    imgElement.onerror = function onError() {
        if (imgElement.dataset.fallbackTried === 'false') {
            imgElement.dataset.fallbackTried = 'true';
            imgElement.src = jpgPath; // png失败时尝试jpg
        } else {
            console.warn(`图片加载失败: ${name}`);
            imgElement.onerror = null;
        }
    };
    imgElement.src = pngPath; // 优先使用png
}

// 更新名片图片显示
function updateCardImages() {
    const frontImg = document.getElementById('card-front-img');
    const backImg = document.getElementById('card-back-img');
    if (state.frontImageName) {
        setImageWithFallback(frontImg, 'pic/zheng', state.frontImageName);
    }
    if (state.backImageName) {
        setImageWithFallback(backImg, 'pic/fan', state.backImageName);
    }
}

// 初始化
video.src = '1.mp4';
video.loop = true;
video.autoplay = false; // 不自动播放，等待用户点击
video.playsInline = true;
video.muted = false; // 确保有声音
video.preload = 'auto'; // 预加载视频
video.pause(); // 确保视频暂停

// 初始化背景音乐
if (bgmAudio) {
    bgmAudio.volume = BGM_CONFIG.normalVolume;
    bgmAudio.preload = 'auto';
    // 页面加载后尝试播放背景音乐
    document.addEventListener('click', function startBGM() {
        if (bgmAudio.paused) {
            bgmAudio.play().catch(err => {
                console.log('背景音乐自动播放失败，需要用户交互:', err);
            });
        }
        // 只执行一次
        document.removeEventListener('click', startBGM);
    }, { once: true });
}

// 立即尝试播放函数
function tryPlayVideo() {
    if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('视频播放成功');
                })
                .catch(err => {
                    console.log('播放被阻止，稍后重试:', err);
                });
        }
    }
}

// 视频预加载完成，但不自动播放（等待用户点击）
video.addEventListener('loadeddata', () => {
    console.log('视频加载完成，等待用户点击播放');
});

// 逐字显示文字
function typeText(text, callback) {
    textDisplay.textContent = '';
    overlay.classList.remove('hidden');
    let index = 0;
    
    function type() {
        if (index < text.length) {
            const char = text[index];
            textDisplay.textContent += char;
            index++;
            
            // 检查是否是句号、问号、感叹号、波浪号，如果是则换行
            if (char === '。' || char === '？' || char === '！' || char === '～') {
                textDisplay.textContent += '\n';
            }
            
            setTimeout(type, 80); // 每80ms显示一个字
        } else if (callback) {
            callback();
        }
    }
    
    type();
}

// 隐藏文字和背景
function hideText() {
    overlay.classList.add('hidden');
    textDisplay.textContent = '';
}

// 切换视频
function switchVideo(videoFile) {
    return new Promise((resolve, reject) => {
        video.src = videoFile;
        video.load();
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => resolve())
                .catch(() => {
                    // 如果自动播放失败，提示用户
                    console.warn('视频自动播放失败，需要用户交互');
                    resolve();
                });
        } else {
            resolve();
        }
    });
}

// 语音识别
let recognition = null;
let isRecording = false;
let recognitionTimeout = null; // 识别超时定时器

function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function(event) {
            // 清除超时定时器
            if (recognitionTimeout) {
                clearTimeout(recognitionTimeout);
                recognitionTimeout = null;
            }
            
            const result = event.results[0][0].transcript;
            // 在左上角显示识别结果
            showRecognitionResult(result);
            processSpeechResult(result);
        };

        recognition.onerror = function(event) {
            console.error('语音识别错误:', event.error);
            
            // 如果已经松开按钮，且识别出错，使用默认值继续
            if (!isRecording && state.step === 4 && !state.recognitionCompleted) {
                // 清除超时定时器
                if (recognitionTimeout) {
                    clearTimeout(recognitionTimeout);
                    recognitionTimeout = null;
                }
                
                // 根据错误类型处理
                if (event.error === 'not-allowed') {
                    // 权限被拒绝
                    const content = document.getElementById('recognition-content');
                    if (content) {
                        content.innerHTML = `
                            <div class="recognition-text"><span class="label">识别结果:</span>麦克风权限被拒绝</div>
                            <div class="recognition-analysis">
                                <span class="label">字数:</span>2
                                <span class="label" style="margin-left: 15px;">声调:</span>一声
                                <br><span style="color: #ffa500; font-size: 12px;">权限被拒绝，使用默认值</span>
                            </div>
                        `;
                    }
                    state.wordCount = 2;
                    state.tone = 1;
                    state.recognitionCompleted = true;
                    logResult(2, 1);
                    // 自动继续下一步
                    proceedAfterRecognition();
                } else {
                    // 其他错误，使用默认值
                    processSpeechResult('');
                }
            } else if (event.error === 'not-allowed' && !isRecording) {
                // 如果权限被拒绝且不在录音状态，显示错误
                recognitionResult.innerHTML = '<span class="label">错误:</span>麦克风权限被拒绝';
                recognitionResult.classList.remove('hidden');
            }
        };

        recognition.onend = function() {
            // 如果还在录音，继续识别
            if (isRecording) {
                try {
                    recognition.start(); // 如果还在按住，继续识别
                } catch (error) {
                    // 静默处理错误，避免弹出提示框
                    console.warn('语音识别重启失败:', error);
                }
            } else {
                // 如果已经松开按钮，但还没有识别结果，使用默认值
                // 这可以处理识别失败或没有识别到内容的情况
                if (state.step === 4 && !state.recognitionCompleted) {
                    // 等待一小段时间，如果还是没有结果，使用默认值
                    setTimeout(() => {
                        if (state.step === 4 && !state.recognitionCompleted) {
                            console.log('识别超时，使用默认值');
                            processSpeechResult(''); // 使用空字符串触发默认值处理
                        }
                    }, 500);
                }
            }
        };
        
        // 页面加载时请求麦克风权限
        requestMicrophonePermission();
    } else {
        console.warn('浏览器不支持语音识别');
    }
}

// 请求麦克风权限
function requestMicrophonePermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                // 权限获取成功，停止流
                stream.getTracks().forEach(track => track.stop());
                console.log('麦克风权限已获取');
            })
            .catch(function(err) {
                console.warn('麦克风权限请求失败:', err);
                recognitionResult.innerHTML = '<span class="label">提示:</span>请允许麦克风权限以使用语音识别功能';
                recognitionResult.classList.remove('hidden');
            });
    } else {
        console.warn('浏览器不支持getUserMedia');
    }
}

// 显示识别结果
function showRecognitionResult(text) {
    const content = document.getElementById('recognition-content');
    if (content) {
        content.innerHTML = `<span class="label">识别结果:</span>${text}`;
    } else {
        // 兼容旧代码
        recognitionResult.innerHTML = `<span class="label">识别结果:</span>${text}`;
    }
    recognitionResult.classList.remove('hidden');
}

// 处理语音识别结果
function processSpeechResult(text) {
    // 清除超时定时器
    if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
        recognitionTimeout = null;
    }
    
    // 先显示识别到的文字
    showRecognitionResult(text || '未识别到内容');
    
    // 提取中文字符
    const chineseChars = (text || '').match(/[\u4e00-\u9fa5]/g) || [];
    
    // 如果没有中文字符，使用默认值
    if (chineseChars.length === 0) {
        state.wordCount = 2;
        state.tone = 1;
        const content = document.getElementById('recognition-content');
        
        if (content) {
            const displayText = text || '未识别到内容';
            content.innerHTML = `
                <div class="recognition-text"><span class="label">识别结果:</span>${displayText}</div>
                <div class="recognition-analysis">
                    <span class="label">字数:</span>2
                    <span class="label" style="margin-left: 15px;">声调:</span>一声
                    <br><span style="color: #ffa500; font-size: 12px;">${text ? '未检测到中文字符，使用默认值' : '识别超时，使用默认值'}</span>
                </div>
            `;
        } else {
            recognitionResult.innerHTML = `<span class="label">识别结果:</span>${text || '未识别到内容'}<br><span class="label">分析:</span>未检测到中文字符`;
        }
        state.recognitionCompleted = true;
        logResult(2, 1);
        // 自动继续下一步
        proceedAfterRecognition();
        return;
    }
    
    // 使用 pinyin-pro 库获取拼音和声调
    try {
        // 检查 pinyin-pro 库是否已加载
        // pinyin-pro 在 CDN 中通常暴露为 window.pinyinPro 对象
        let pinyinFunc = null;
        
        // 尝试多种方式获取 pinyin-pro
        if (typeof window !== 'undefined') {
            // 方式1: window.pinyinPro.pinyin
            if (window.pinyinPro && typeof window.pinyinPro.pinyin === 'function') {
                pinyinFunc = window.pinyinPro.pinyin.bind(window.pinyinPro);
            }
            // 方式2: window.pinyinPro 本身就是函数
            else if (typeof window.pinyinPro === 'function') {
                pinyinFunc = window.pinyinPro;
            }
            // 方式3: window.pinyin
            else if (typeof window.pinyin === 'function') {
                pinyinFunc = window.pinyin;
            }
        }
        
        // 如果全局变量中没有，尝试直接使用（非严格模式）
        if (!pinyinFunc) {
            try {
                if (typeof pinyinPro !== 'undefined') {
                    if (typeof pinyinPro.pinyin === 'function') {
                        pinyinFunc = pinyinPro.pinyin.bind(pinyinPro);
                    } else if (typeof pinyinPro === 'function') {
                        pinyinFunc = pinyinPro;
                    }
                }
            } catch (e) {
                // 忽略错误
            }
        }
        
        if (!pinyinFunc) {
            console.error('pinyin-pro 库未加载，请检查 CDN 链接');
            throw new Error('pinyin-pro 库未加载或无法找到，必须使用 pinyin-pro 库');
        }
        
        console.log('pinyin-pro 库已找到，开始处理拼音');
        
        // 计算字数分类（小于2归为2，大于4归为4）
        let charCount = chineseChars.length;
        let wordCount;
        if (charCount <= 2) {
            wordCount = 2;
        } else if (charCount === 3) {
            wordCount = 3;
        } else {
            wordCount = 4; // 4及以上归为4类
        }
        
        // 获取最后一个字的拼音和声调
        const lastChar = chineseChars[chineseChars.length - 1];
        let tone = 1; // 默认1声
        
        // 获取最后一个字的拼音（带数字声调）
        let lastCharPinyin = '';
        try {
            // 调用 pinyin-pro API 获取带数字声调的拼音
            lastCharPinyin = pinyinFunc(lastChar, { toneType: 'num' });
            
            // 从拼音中提取声调数字（如 "ni3" -> 3, "ma1" -> 1）
            const toneMatch = lastCharPinyin.match(/(\d)/);
            if (toneMatch) {
                tone = parseInt(toneMatch[1]);
                if (tone === 0) tone = 1; // 轻声转为1声
                if (tone < 1 || tone > 4) tone = 1; // 确保在1-4范围内
            }
        } catch (error) {
            console.warn('获取声调失败，使用默认值:', error);
            // 如果数字声调失败，尝试使用符号声调
            try {
                const symbolPinyin = pinyinFunc(lastChar, { toneType: 'symbol' });
                // 从符号声调中提取（ā=1, á=2, ǎ=3, à=4）
                if (symbolPinyin.includes('ā') || symbolPinyin.includes('ē') || symbolPinyin.includes('ī') || 
                    symbolPinyin.includes('ō') || symbolPinyin.includes('ū') || symbolPinyin.includes('ǖ')) {
                    tone = 1;
                } else if (symbolPinyin.includes('á') || symbolPinyin.includes('é') || symbolPinyin.includes('í') || 
                          symbolPinyin.includes('ó') || symbolPinyin.includes('ú') || symbolPinyin.includes('ǘ')) {
                    tone = 2;
                } else if (symbolPinyin.includes('ǎ') || symbolPinyin.includes('ě') || symbolPinyin.includes('ǐ') || 
                          symbolPinyin.includes('ǒ') || symbolPinyin.includes('ǔ') || symbolPinyin.includes('ǚ')) {
                    tone = 3;
                } else if (symbolPinyin.includes('à') || symbolPinyin.includes('è') || symbolPinyin.includes('ì') || 
                          symbolPinyin.includes('ò') || symbolPinyin.includes('ù') || symbolPinyin.includes('ǜ')) {
                    tone = 4;
                }
            } catch (e2) {
                console.warn('使用符号声调也失败:', e2);
            }
        }
        
        // 获取所有字的拼音信息用于显示
        let pinyinInfo = '';
        try {
            const allPinyins = chineseChars.map(char => {
                let pinyinStr = '';
                try {
                    pinyinStr = pinyinFunc(char, { toneType: 'symbol' });
                } catch (e) {
                    pinyinStr = char;
                }
                return `${char}(${pinyinStr})`;
            });
            pinyinInfo = `<br><span class="label">拼音:</span>${allPinyins.join(' ')}`;
        } catch (error) {
            console.warn('获取拼音信息失败:', error);
        }
        
        // 更新状态
        state.wordCount = wordCount;
        state.tone = tone;
        
        // 声调文字映射
        const toneName = TONE_NAME_MAP[tone] || '一声';
        
        // 更新识别结果显示（在左上角显示）
        const content = document.getElementById('recognition-content');
        
        if (content) {
            // 显示格式：字数：2/3/4，声调：一声/二声/三声/四声
            content.innerHTML = `
                <div class="recognition-text"><span class="label">识别结果:</span>${text}${pinyinInfo}</div>
                <div class="recognition-analysis">
                    <span class="label">字数:</span>${wordCount}
                    <span class="label" style="margin-left: 15px;">声调:</span>${toneName}
                </div>
            `;
        } else {
            // 兼容旧代码
            const resultInfo = `字数: ${wordCount}, 声调: ${toneName}`;
            recognitionResult.innerHTML = `<span class="label">识别结果:</span>${text}${pinyinInfo}<br><span class="label">分析:</span>${resultInfo}`;
        }
        
        // 标记识别完成
        state.recognitionCompleted = true;
        
        // 记录结果到后台（格式：2-一声）
        logResult(wordCount, tone);
        
        console.log('识别结果:', { text, wordCount, tone, toneName, chineseChars });
        
        // 自动继续下一步
        proceedAfterRecognition();
        
    } catch (error) {
        console.error('拼音转换错误:', error);
        // 如果 pinyin-pro 不可用，使用备用方法
        useFallbackMethod(text, chineseChars);
    }
}

// 备用方法（当 pinyin-pro 不可用时使用）
function useFallbackMethod(text, chineseChars) {
    // 计算字数分类（小于2归为2，大于4归为4）
    let charCount = chineseChars.length;
    let wordCount;
    if (charCount <= 2) {
        wordCount = 2;
    } else if (charCount === 3) {
        wordCount = 3;
    } else {
        wordCount = 4; // 4及以上归为4类
    }
    
    // 获取最后一个字的声调（使用简单算法）
    const lastChar = chineseChars[chineseChars.length - 1];
    let tone = 1;
    if (lastChar) {
        const charCode = lastChar.charCodeAt(0);
        tone = (charCode % 4) + 1;
    }
    
    state.wordCount = wordCount;
    state.tone = tone;
    
    // 声调文字映射
    const toneName = TONE_NAME_MAP[tone] || '一声';
    
    // 更新识别结果显示
    const content = document.getElementById('recognition-content');
    
    if (content) {
        content.innerHTML = `
            <div class="recognition-text"><span class="label">识别结果:</span>${text}</div>
            <div class="recognition-analysis">
                <span class="label">字数:</span>${wordCount}
                <span class="label" style="margin-left: 15px;">声调:</span>${toneName}
                <br><span style="color: #ffa500; font-size: 12px;">(使用备用方法)</span>
            </div>
        `;
    } else {
        recognitionResult.innerHTML = `<span class="label">识别结果:</span>${text}<br><span class="label">分析:</span>字数: ${wordCount}, 声调: ${toneName} (使用备用方法)`;
    }
    
    // 标记识别完成
    state.recognitionCompleted = true;
    
    // 记录结果到后台
    logResult(wordCount, tone);
    
    // 自动继续下一步
    proceedAfterRecognition();
}

// 识别完成后自动继续下一步
function proceedAfterRecognition() {
    if (state.step === 4 && state.recognitionCompleted) {
        // 隐藏识别结果
        recognitionResult.classList.add('hidden');
        
        // 显示文字
        typeText(texts.step2, () => {
            state.step = 5; // 进入物品选择状态
        });
    }
}

// 记录结果到后台（格式：2-一声）
function logResult(wordCount, tone) {
    const toneName = TONE_NAME_MAP[tone] || '一声';
    const result = `${wordCount}-${toneName}`;
    
    // 在控制台输出（实际项目中可以发送到服务器）
    console.log('记录结果:', result);
    
    // 可以在这里添加发送到后台服务器的代码
    // 例如：fetch('/api/log', { method: 'POST', body: JSON.stringify({ result }) });
}

// 点击事件处理
let clickHandler = null;

function setupClickHandler() {
    if (clickHandler) {
        document.removeEventListener('click', clickHandler);
    }
    
    clickHandler = function(e) {
        // 如果点击的是按钮、物品、名片页或卡片，不处理
        if (e.target.closest('.call-button') || 
            e.target.closest('.item-bar') || 
            e.target.closest('.card-button') ||
            e.target.closest('.card-page') ||
            e.target.closest('.card-container')) {
            return;
        }
        
        // 播放提示的点击也要处理
        handleClick();
    };
    
    document.addEventListener('click', clickHandler);
}

function handleClick() {
    switch(state.step) {
        case -1: // 等待播放状态，第一次点击播放视频
            video.play().then(() => {
                console.log('视频开始播放');
                // 开始播放背景音乐
                if (bgmAudio && bgmAudio.paused) {
                    bgmAudio.play().catch(err => {
                        console.log('背景音乐播放失败:', err);
                    });
                }
                state.step = 0; // 进入等待开始交互状态
            }).catch(err => {
                console.log('播放失败:', err);
            });
            break;
            
        case 0: // 已播放，等待开始交互，第二次点击开始流程
            state.step = 1;
            typeText(texts.step1, () => {
                state.step = 2; // 文字显示完成，等待再次点击
            });
            break;
            
        case 1: // 文字正在显示中，忽略点击
            // 等待文字显示完成
            break;
            
        case 2: // 文字显示完成，点击隐藏
            hideText();
            callButton.classList.remove('hidden');
            state.step = 3;
            break;
            
        case 4: // 等待识别结果，自动继续
            // 识别完成后会自动继续，不处理点击
            break;
            
        case 5: // 物品选择状态，点击隐藏文字
            hideText();
            switchVideo('3.mp4');
            itemBar.classList.remove('hidden');
            break;
            
        case 6: // 显示最终文字，点击进入名片页
            hideText();
            showCardPage();
            state.step = 7;
            break;
            
        case 7: // 名片页，点击不处理（由按钮处理）
            break;
    }
}

// 点击呼唤按钮（点击开始，再次点击结束）
callButton.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡，避免触发其他点击事件
    
    if (state.step === 3) {
        if (!isRecording) {
            // 第一次点击：开始识别
            isRecording = true;
            switchVideo('2.mp4');
            
            // 降低背景音乐音量
            if (bgmAudio) {
                bgmAudio.volume = BGM_CONFIG.lowVolume;
            }
            
            if (recognition) {
                try {
                    recognition.start();
                } catch (error) {
                    // 静默处理错误，避免弹出提示框
                    console.warn('语音识别启动失败:', error);
                    isRecording = false;
                    this.textContent = '点击开始识别';
                    // 恢复背景音乐音量
                    if (bgmAudio) {
                        bgmAudio.volume = BGM_CONFIG.normalVolume;
                    }
                }
            }
            
            this.textContent = '点击结束识别';
        } else {
            // 第二次点击：停止识别并立即进入下一个环节
            isRecording = false;
            
            // 恢复背景音乐音量
            if (bgmAudio) {
                bgmAudio.volume = BGM_CONFIG.normalVolume;
            }
            
            if (recognition) {
                recognition.stop();
            }
            
            // 清除之前的超时定时器
            if (recognitionTimeout) {
                clearTimeout(recognitionTimeout);
                recognitionTimeout = null;
            }
            
            this.textContent = '点击开始识别';
            this.classList.add('hidden');
            
            // 隐藏识别结果
            recognitionResult.classList.add('hidden');
            
            // 如果识别结果还没完成，使用默认值
            if (!state.recognitionCompleted) {
                state.wordCount = 2;
                state.tone = 1;
                logResult(2, 1);
            }
            
            // 直接进入下一个环节
            typeText(texts.step2, () => {
                state.step = 5; // 进入物品选择状态
            });
        }
    }
});

// 拖拽功能
const items = document.querySelectorAll('.item');
let draggedItemImage = null; // 保存被拖动的图片元素

items.forEach(item => {
    item.addEventListener('dragstart', function(e) {
        if (state.step === 5) {
            this.classList.add('dragging');
            state.category = this.dataset.category;
            // 保存被拖动的图片元素
            draggedItemImage = this.querySelector('.item-image');
            e.dataTransfer.effectAllowed = 'move';
        }
    });
    
    item.addEventListener('dragend', function() {
        this.classList.remove('dragging');
    });
});

videoContainer.addEventListener('dragover', function(e) {
    if (state.step === 5) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
});

videoContainer.addEventListener('drop', function(e) {
    if (state.step === 5) {
        e.preventDefault();
        
        // 隐藏物品栏
        itemBar.classList.add('hidden');
        
        // 清空animation-placeholder的内容
        animationPlaceholder.innerHTML = '';
        
        // 如果有被拖动的图片，将其复制到animation-placeholder中
        if (draggedItemImage) {
            const clonedImage = draggedItemImage.cloneNode(true);
            clonedImage.style.width = '100%';
            clonedImage.style.height = '100%';
            clonedImage.style.objectFit = 'contain';
            clonedImage.style.borderRadius = '10px';
            animationPlaceholder.appendChild(clonedImage);
        }
        
        // 显示动画
        animationPlaceholder.classList.remove('hidden');
        
        // 后台计算（模拟）
        setTimeout(() => {
            // 计算对应的图片和视频
            // 格式：字数-声调-分类 (例如: 2-1-a)
            const imageKey = buildImageKey(state.wordCount, state.tone, state.category);
            console.log('选择的组合:', imageKey);

            const frontName = FRONT_IMAGE_MAP[imageKey];
            if (!frontName) {
                console.warn(`未找到前景图映射: ${imageKey}`);
            }
            const backName = frontName ? (BACK_IMAGE_MAP[frontName] || '') : '';

            state.frontImageName = frontName || '';
            state.backImageName = backName || '';

            if (!backName && frontName) {
                console.warn(`未找到背面图映射: ${frontName}`);
            }

            updateCardImages();
            
            // 隐藏动画
            animationPlaceholder.classList.add('hidden');
            
            // 根据识别到的名片名称播放对应的MP4文件
            // 优先使用名片名称对应的视频，如果没有则使用背面图对应的视频
            let videoFile = null;
            
            // 首先根据正面图片名称查找对应的视频
            if (state.frontImageName && NAME_TO_VIDEO_MAP[state.frontImageName]) {
                videoFile = NAME_TO_VIDEO_MAP[state.frontImageName];
            }
            // 如果没有找到，尝试根据背面图名称查找
            else if (state.backImageName) {
                // 根据背面图名称映射到视频文件
                const backToVideoMap = {
                    '狸花猫': '狸花猫.mp4',
                    '橘猫': '橘猫.mp4',
                    '三花猫': '三花猫.mp4',
                    '三花': '三花猫.mp4', // 兼容旧数据
                    '白猫': '白猫.mp4',
                    '黑猫': '黑猫.mp4',
                    '奶牛猫': '奶牛猫.mp4',
                    '玳瑁': '玳瑁.mp4'
                };
                if (backToVideoMap[state.backImageName]) {
                    videoFile = backToVideoMap[state.backImageName];
                }
            }
            
            // 如果还是没有找到，使用默认视频
            if (!videoFile) {
                videoFile = '3.mp4';
            }
            
            // 播放对应的视频
            const testVideo = document.createElement('video');
            testVideo.src = videoFile;
            testVideo.onerror = () => {
                // 文件不存在，继续播放3.mp4
                console.warn(`视频文件不存在: ${videoFile}，使用默认视频3.mp4`);
                switchVideo('3.mp4').then(() => {
                    // 等待视频开始播放后，播放5秒再显示文字
                    const onPlaying = () => {
                        video.removeEventListener('playing', onPlaying);
                        setTimeout(() => {
                            typeText(texts.step3, () => {
                                state.step = 6;
                            });
                        }, 5000);
                    };
                    video.addEventListener('playing', onPlaying);
                    // 如果视频已经在播放，立即触发
                    if (!video.paused) {
                        onPlaying();
                    }
                });
            };
            testVideo.oncanplay = () => {
                // 文件存在，播放它
                console.log(`播放视频: ${videoFile}`);
                switchVideo(videoFile).then(() => {
                    // 等待视频开始播放后，播放5秒再显示文字
                    const onPlaying = () => {
                        video.removeEventListener('playing', onPlaying);
                        setTimeout(() => {
                            typeText(texts.step3, () => {
                                state.step = 6;
                            });
                        }, 5000);
                    };
                    video.addEventListener('playing', onPlaying);
                    // 如果视频已经在播放，立即触发
                    if (!video.paused) {
                        onPlaying();
                    }
                });
            };
            testVideo.load();
        }, 2000); // 2秒后完成计算
    }
});

// 显示名片页面
function showCardPage() {
    cardPage.classList.remove('hidden');
    cardContainer.classList.remove('flipped'); // 确保从正面开始
    
    const imageKey = buildImageKey(state.wordCount, state.tone, state.category);

    if (!state.frontImageName) {
        state.frontImageName = FRONT_IMAGE_MAP[imageKey] || '';
    }
    if (!state.backImageName && state.frontImageName) {
        state.backImageName = BACK_IMAGE_MAP[state.frontImageName] || '';
    }

    if (!state.frontImageName) {
        console.warn(`名片正面未找到，键值: ${imageKey}`);
    }
    if (state.frontImageName && !state.backImageName) {
        console.warn(`名片背面未找到，对应正面: ${state.frontImageName}`);
    }

    updateCardImages();

    console.log('正面图片:', state.frontImageName || imageKey);
    console.log('反面图片:', state.backImageName || '未找到');
}

// 名片点击翻面
cardContainer.addEventListener('click', function(e) {
    // 如果点击的是按钮，不翻面
    if (e.target.closest('.card-button')) {
        return;
    }
    
    // 切换翻面状态
    cardContainer.classList.toggle('flipped');
});

// 保存名片（同时保存正反面）
saveButton.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    
    const frontImg = document.getElementById('card-front-img');
    const backImg = document.getElementById('card-back-img');
    
    if (!frontImg || !backImg) {
        alert('图片元素未找到，无法保存名片');
        return;
    }
    
    if (!frontImg.src || frontImg.src === '' || frontImg.src.includes('data:image/svg')) {
        alert('正面图片未加载，请等待图片加载完成后再保存');
        return;
    }
    
    if (!backImg.src || backImg.src === '' || backImg.src.includes('data:image/svg')) {
        alert('反面图片未加载，请等待图片加载完成后再保存');
        return;
    }
    
    console.log('开始保存名片，正面:', frontImg.src, '反面:', backImg.src);
    
    // 保存图片的通用函数
    function saveImage(imgElement, imageName, isBack) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject('无法创建画布上下文');
                return;
            }
            
            // 横向尺寸，放大1.5倍
            canvas.width = 1080;
            canvas.height = 720;
            
            // 绘制透明背景（因为图片是PNG透明底）
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const img = new Image();
            
            img.onload = function() {
                try {
                    // 计算图片在画布中的位置和尺寸（保持比例）
                    const padding = 28;
                    const maxWidth = canvas.width - padding * 2;
                    const maxHeight = canvas.height - padding * 2;
                    
                    let drawWidth = img.width;
                    let drawHeight = img.height;
                    
                    // 按比例缩放
                    const scale = Math.min(maxWidth / drawWidth, maxHeight / drawHeight);
                    drawWidth = drawWidth * scale;
                    drawHeight = drawHeight * scale;
                    
                    // 居中绘制
                    const x = (canvas.width - drawWidth) / 2;
                    const y = (canvas.height - drawHeight) / 2;
                    
                    ctx.drawImage(img, x, y, drawWidth, drawHeight);
                    
                    // 创建下载链接
                    canvas.toBlob(function(blob) {
                        if (blob) {
                            try {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                const fileName = `${isBack ? '名片反面' : '名片正面'}_${imageName || state.wordCount}-${state.tone}-${state.category}.png`;
                                a.download = fileName;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                
                                // 延迟释放URL，确保下载完成
                                setTimeout(() => {
                                    URL.revokeObjectURL(url);
                                }, 100);
                                
                                console.log('保存成功:', fileName);
                                resolve();
                            } catch (err) {
                                console.error('创建下载链接失败:', err);
                                reject('创建下载链接失败: ' + err.message);
                            }
                        } else {
                            reject('canvas.toBlob 返回 null');
                        }
                    }, 'image/png');
                } catch (err) {
                    console.error('绘制图片失败:', err);
                    reject('绘制图片失败: ' + err.message);
                }
            };
            
            img.onerror = function(err) {
                console.error('图片加载失败:', imgElement.src, err);
                reject('图片加载失败: ' + imgElement.src);
            };
            
            // 设置图片源
            img.src = imgElement.src;
            
            // 如果图片已经加载完成，直接触发onload
            if (img.complete && img.naturalWidth > 0) {
                img.onload();
            }
        });
    }
    
    // 依次保存正反面
    saveImage(frontImg, state.frontImageName, false)
        .then(() => {
            console.log('正面保存完成，开始保存反面');
            return saveImage(backImg, state.backImageName, true);
        })
        .then(() => {
            console.log('正反面保存完成');
        })
        .catch((error) => {
            console.error('保存失败:', error);
            alert('保存失败: ' + error);
        });
});

// 重新开始
restartButton.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    
    // 重置状态
    state = {
        step: -1, // 回到等待播放状态
        wordCount: 0,
        tone: 0,
        category: '',
        recognitionCompleted: false,
        frontImageName: '',
        backImageName: ''
    };
    
    // 隐藏识别结果
    recognitionResult.classList.add('hidden');
    
    // 隐藏所有元素
    overlay.classList.add('hidden');
    callButton.classList.add('hidden');
    itemBar.classList.add('hidden');
    animationPlaceholder.classList.add('hidden');
    cardPage.classList.add('hidden');
    cardContainer.classList.remove('flipped');
    
    // 重置视频
    video.pause();
    video.currentTime = 0;
    switchVideo('1.mp4');
    
    // 重新设置点击事件
    setupClickHandler();
});


// 初始化
initSpeechRecognition();
setupClickHandler();

// 视频加载错误处理
video.addEventListener('error', function() {
    console.warn('视频加载失败，继续使用当前视频');
});

