document.addEventListener('DOMContentLoaded', () => {
    // ------------------
    // 상태 변수 (State Variables)
    // ------------------
    let selectedDayData = null; // 선택된 Day의 단어 데이터
    let currentIndex = 0;       // 현재 단어의 인덱스
    let studyMode = 'en-ko';    // 학습 모드 ('en-ko' 또는 'ko-en')
    let showMeaning = false;    // 정답 표시 여부

    // ------------------
    // DOM 요소 (DOM Elements)
    // ------------------
    const daySelector = document.getElementById('day-selector');
    const vocaCardContainer = document.getElementById('voca-card-container');
    const studyModeToggle = document.getElementById('study-mode-toggle');

    // ------------------
    // 핵심 함수 (Core Functions)
    // ------------------

    /**
     * 배열의 순서를 무작위로 섞는 함수
     * @param {Array} array - 섞을 배열
     * @returns {Array} - 순서가 섞인 새로운 배열
     */
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    /**
     * 주어진 영어 단어를 음성으로 재생하는 함수 (Text-to-Speech)
     * @param {string} word - 발음할 영어 단어
     */
    const handleSpeak = (word) => {
        if (word && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // 이전 음성 재생이 있다면 중지
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US'; // 미국식 영어 발음으로 설정
            window.speechSynthesis.speak(utterance);
        }
    };
    
    /**
     * 현재 상태에 맞춰 단어 카드 UI를 화면에 렌더링하는 함수
     */
    const renderVocaCard = () => {
        // Day가 선택되지 않았을 때 초기 안내 메시지 표시
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

        // 학습 모드에 따라 문제와 정답 내용 구성
        if (isEnKoMode) { // 영단어 -> 뜻
            questionContent = `
                <div class="flex items-center gap-4">
                    <h2 class="font-montserrat text-5xl md:text-7xl font-bold text-blue-600">${wordData.en}</h2>
                    <button id="speak-button-question" class="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" title="발음 듣기">
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
        } else { // 뜻 -> 영단어
            const koWordClass = wordData.ko.length > 15 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';
            questionContent = `
                <h2 class="font-sans font-bold text-blue-600 ${koWordClass}">${wordData.ko}</h2>
                <div class="h-8 mt-2"></div>`;
            answerContent = `
                <div class="w-full animate-fade-in text-center">
                    <div class="flex items-center justify-center gap-4">
                        <h2 class="font-montserrat text-5xl md:text-7xl font-bold text-red-600">${wordData.en}</h2>
                        <button id="speak-button-answer" class="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" title="발음 듣기">
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

        // 전체 카드 HTML 구조 생성
        vocaCardContainer.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-10 min-h-[450px] flex flex-col justify-between">
                <div class="text-right text-gray-500 font-medium">
                    ${currentIndex + 1} / ${totalWords}
                </div>
                <div class="flex-grow flex flex-col justify-center items-center gap-2 text-center">
                    ${questionContent}
                </div>
                <div id="answer-section" class="min-h-[180px] mt-4 flex flex-col justify-center items-center text-center">
                    ${!showMeaning ? 
                        `<button id="show-meaning-button" class="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-orange-600 transition-transform transform hover:scale-105">
                            ${isEnKoMode ? '뜻 보기' : '영어단어 보기'}
                        </button>` : 
                        answerContent
                    }
                </div>
                <div class="flex justify-between mt-6">
                    <button id="prev-button" ${currentIndex === 0 ? 'disabled' : ''} class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                        이전
                    </button>
                    <button id="next-button" ${currentIndex === totalWords - 1 ? 'disabled' : ''} class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                        다음
                    </button>
                </div>
            </div>`;
            
        // 카드가 새로 그려질 때마다 버튼에 이벤트 리스너를 다시 연결
        addCardEventListeners(wordData);
    };
    
    /**
     * 동적으로 생성된 카드 내부 버튼들에 이벤트 리스너를 추가하는 함수
     * @param {object} wordData - 현재 단어 데이터
     */
    const addCardEventListeners = (wordData) => {
        const showMeaningButton = document.getElementById('show-meaning-button');
        if (showMeaningButton) {
            showMeaningButton.addEventListener('click', () => {
                showMeaning = true;
                renderVocaCard();
            });
        }
        
        // 질문 영역의 스피커 버튼
        const speakButtonQuestion = document.getElementById('speak-button-question');
        if (speakButtonQuestion) {
            speakButtonQuestion.addEventListener('click', () => handleSpeak(wordData.en));
        }

        // 정답 영역의 스피커 버튼
        const speakButtonAnswer = document.getElementById('speak-button-answer');
        if (speakButtonAnswer) {
            speakButtonAnswer.addEventListener('click', () => handleSpeak(wordData.en));
        }

        // 이전/다음 버튼
        document.getElementById('prev-button').addEventListener('click', () => handleNavigation('prev'));
        document.getElementById('next-button').addEventListener('click', () => handleNavigation('next'));
    };

    /**
     * '이전' 또는 '다음' 버튼 클릭을 처리하는 함수
     * @param {'prev' | 'next'} direction - 이동 방향
     */
    const handleNavigation = (direction) => {
        if (!selectedDayData) return;
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < selectedDayData.words.length) {
            currentIndex = newIndex;
            showMeaning = false; // 다음 단어로 넘어가면 정답을 다시 숨김
            renderVocaCard();
        }
    };
    
    // ------------------
    // 이벤트 리스너 설정 (Event Listeners)
    // ------------------

    // Day 선택 메뉴 변경 이벤트
    daySelector.addEventListener('change', (e) => {
        const day = Number(e.target.value);
        const dayData = window.vocaData.find(d => d.day === day);
        if (dayData) {
            const shuffledWords = shuffleArray(dayData.words);
            selectedDayData = { ...dayData, words: shuffledWords };
            currentIndex = 0;
            showMeaning = false;
            renderVocaCard();
        }
    });

    // 학습 모드 토글 버튼 클릭 이벤트
    studyModeToggle.addEventListener('click', (e) => {
        const button = e.target.closest('.study-mode-button');
        if (button && button.dataset.mode !== studyMode) {
            studyMode = button.dataset.mode;
            showMeaning = false;

            // 버튼 활성화/비활성화 스타일 업데이트
            document.querySelectorAll('.study-mode-button').forEach(btn => {
                if (btn.dataset.mode === studyMode) {
                    btn.classList.add('bg-white', 'text-blue-600', 'shadow');
                    btn.classList.remove('text-gray-600', 'hover:bg-gray-300');
                } else {
                    btn.classList.remove('bg-white', 'text-blue-600', 'shadow');
                    btn.classList.add('text-gray-600', 'hover:bg-gray-300');
                }
            });

            // 단어가 이미 선택된 상태라면 카드 UI만 다시 렌더링
            if(selectedDayData) {
                renderVocaCard();
            }
        }
    });


    // ------------------
    // 초기화 함수 (Initialization)
    // ------------------
    const init = () => {
        // voca-data.js에서 데이터를 가져와 Day 선택 메뉴를 동적으로 생성
        if (window.vocaData && window.vocaData.length > 0) {
            window.vocaData.forEach(d => {
                const option = document.createElement('option');
                option.value = d.day;
                option.textContent = `Day ${d.day}`;
                daySelector.appendChild(option);
            });
        }

        // 초기 화면 렌더링
        renderVocaCard();
    };

    // 페이지 로드 완료 시 앱 초기화 실행
    init();
});
