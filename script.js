document.addEventListener('DOMContentLoaded', () => {
    // ------------------
    // 상태 변수 (State Variables)
    // ------------------
    let selectedDayData = null;
    let currentIndex = 0;
    let studyMode = 'en-ko';
    let showMeaning = false;
    let isAudioUnlocked = false; // 모바일 오디오 잠금 해제 상태

    // ------------------
    // DOM 요소 (DOM Elements)
    // ------------------
    const daySelector = document.getElementById('day-selector');
    const vocaCardContainer = document.getElementById('voca-card-container');
    const studyModeToggle = document.getElementById('study-mode-toggle');
    
    // ------------------
    // 음성 재생(TTS) 관련 설정
    // ------------------
    try {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    } catch (e) {
        console.error("Speech Synthesis API is not supported in this browser.", e);
    }

    /**
     * 모바일 브라우저(특히 iOS)에서 오디오 재생 권한을 얻기 위한 함수.
     * 사용자의 첫 터치 이벤트 시 호출되어야 합니다.
     */
    const unlockAudio = () => {
        if (isAudioUnlocked || !('speechSynthesis' in window)) return;
        
        // 아주 짧은 빈 소리를 재생하여 오디오 컨텍스트를 활성화합니다.
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);
        isAudioUnlocked = true;
    };

    // ------------------
    // 핵심 함수 (Core Functions)
    // ------------------

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleSpeak = (word) => {
        if (!('speechSynthesis' in window) || !word) {
            alert('음성 재생 기능이 지원되지 않는 브라우저입니다.');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };
    
    const renderVocaCard = () => {
        if (!selectedDayData) {
            vocaCardContainer.innerHTML = `
                <div class="bg-white border border-gray-200 rounded-xl p-6 md:p-10 min-h-[450px] flex items-center justify-center">
                    <p class="text-gray-500 text-xl">학습할 Day를 선택해 주세요.</p>
                </div>`;
            return;
        }

        const wordData = selectedDayData.words[currentIndex];
        const isEnKoMode = studyMode === 'en-ko';
        const totalWords = selectedDayData.words.length;

        const speakerIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>`;

        let questionContent, answerContent;

        if (isEnKoMode) {
            questionContent = `
                <div class="flex items-center gap-4">
                    <h2 class="font-montserrat text-5xl md:text-7xl font-bold text-blue-600">${wordData.en}</h2>
                    <button data-speak-word="${wordData.en}" class="speak-button text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" title="발음 듣기">
                        ${speakerIcon}
                    </button>
                </div>
                <div class="h-8 mt-2"></div>`;
            answerContent = `
                <div class="w-full animate-fade-in text-center">
                    <p class="text-3xl font-bold text-red-600">${wordData.ko}</p>
                    <div class="mt-4 p-4 bg-blue-50 rounded-lg text-left w-full">
                        <p class="text-xl text-blue-800 font-medium">${wordData.sentence}</p>
                        <p class="text-lg text-blue-600 mt-1">${wordData.translation}</p>
                    </div>
                </div>`;
        } else {
            const koWordClass = wordData.ko.length > 15 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';
            questionContent = `
                <h2 class="font-sans font-bold text-blue-600 ${koWordClass}">${wordData.ko}</h2>
                <div class="h-8 mt-2"></div>`;
            answerContent = `
                <div class="w-full animate-fade-in text-center">
                    <div class="flex items-center justify-center gap-4">
                        <h2 class="font-montserrat text-5xl md:text-7xl font-bold text-red-600">${wordData.en}</h2>
                        <button data-speak-word="${wordData.en}" class="speak-button text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" title="발음 듣기">
                            ${speakerIcon}
                        </button>
                    </div>
                    <div class="h-8 mt-2"></div>
                    <div class="mt-4 p-4 bg-blue-50 rounded-lg text-left w-full">
                        <p class="text-xl text-blue-800 font-medium">${wordData.sentence}</p>
                        <p class="text-lg text-blue-600 mt-1">${wordData.translation}</p>
                    </div>
                </div>`;
        }

        vocaCardContainer.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-10 min-h-[450px] flex flex-col justify-between">
                <div class="text-right text-gray-500 font-medium">${currentIndex + 1} / ${totalWords}</div>
                <div class="flex-grow flex flex-col justify-center items-center gap-2 text-center">${questionContent}</div>
                <div id="answer-section" class="min-h-[180px] mt-4 flex flex-col justify-center items-center text-center">
                    ${!showMeaning ? `<button id="show-meaning-button" class="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-orange-600 transition-transform transform hover:scale-105">${isEnKoMode ? '뜻 보기' : '영어단어 보기'}</button>` : answerContent}
                </div>
                <div class="flex justify-between mt-6">
                    <button id="prev-button" ${currentIndex === 0 ? 'disabled' : ''} class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">이전</button>
                    <button id="next-button" ${currentIndex === totalWords - 1 ? 'disabled' : ''} class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">다음</button>
                </div>
            </div>`;
            
        addCardEventListeners();
    };
    
    const addCardEventListeners = () => {
        const showMeaningButton = document.getElementById('show-meaning-button');
        if (showMeaningButton) {
            showMeaningButton.addEventListener('click', () => {
                unlockAudio(); // 사용자의 첫 터치 중 하나로 간주하고 오디오 잠금 해제
                showMeaning = true;
                renderVocaCard();
            });
        }
        
        document.querySelectorAll('.speak-button').forEach(button => {
            button.addEventListener('click', (e) => {
                unlockAudio(); // 스피커 버튼 클릭도 사용자의 터치이므로 잠금 해제 시도
                const wordToSpeak = e.currentTarget.dataset.speakWord;
                handleSpeak(wordToSpeak);
            });
        });

        document.getElementById('prev-button').addEventListener('click', () => handleNavigation('prev'));
        document.getElementById('next-button').addEventListener('click', () => handleNavigation('next'));
    };

    const handleNavigation = (direction) => {
        if (!selectedDayData) return;
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < selectedDayData.words.length) {
            currentIndex = newIndex;
            showMeaning = false;
            renderVocaCard();
        }
    };
    
    // ------------------
    // 이벤트 리스너 설정
    // ------------------
    daySelector.addEventListener('change', (e) => {
        unlockAudio(); // 사용자의 첫 터치 중 하나로 간주하고 오디오 잠금 해제
        const day = Number(e.target.value);
        const dayData = window.vocaData.find(d => d.day === day);
        if (dayData) {
            selectedDayData = { ...dayData, words: shuffleArray(dayData.words) };
            currentIndex = 0;
            showMeaning = false;
            renderVocaCard();
        }
    });

    studyModeToggle.addEventListener('click', (e) => {
        const button = e.target.closest('.study-mode-button');
        if (button) {
            unlockAudio(); // 사용자의 첫 터치 중 하나로 간주하고 오디오 잠금 해제
            if (button.dataset.mode !== studyMode) {
                studyMode = button.dataset.mode;
                showMeaning = false;
                document.querySelectorAll('.study-mode-button').forEach(btn => {
                    btn.classList.toggle('bg-white', btn.dataset.mode === studyMode);
                    btn.classList.toggle('text-blue-600', btn.dataset.mode === studyMode);
                    btn.classList.toggle('shadow', btn.dataset.mode === studyMode);
                    btn.classList.toggle('text-gray-600', btn.dataset.mode !== studyMode);
                    btn.classList.toggle('hover:bg-gray-300', btn.dataset.mode !== studyMode);
                });
                if(selectedDayData) renderVocaCard();
            }
        }
    });

    // ------------------
    // 초기화 함수
    // ------------------
    const init = () => {
        if (window.vocaData && window.vocaData.length > 0) {
            window.vocaData.forEach(d => {
                const option = document.createElement('option');
                option.value = d.day;
                option.textContent = `Day ${d.day}`;
                daySelector.appendChild(option);
            });
        }
        renderVocaCard();
    };

    init();
});
