class TimesWar{
    constructor(param){

        if(param && param.mode) t.mode = param.mode;

        this.data = {
            player1: {
                name: '',
                cards: [12, 12, 12]
            },
            player2: {
                name: '',
                cards: [12, 12, 12]
            },
            board: [
                '', '', '', '', '',
                '', '', '', '', '',
                '', '', '', '', '',
                '', '', '', '', '',
                '', '', '', '', '',
            ],
            thisTurn: this.getRandomNum(1, 2),
            pickedIdx: undefined,
            wonTiles: [],
            timer: {
                raf: undefined,
                duration: 60 * 1000,
                startTime: undefined
            }

        }

        this.ui = {}

        this.setClssId();
        this.setCSS();
        this.setLayout();
        this.setTileSize();
        this.eventBinding();
        this.initCardsNum();
        this.updatePlayerCardUI('setting');
        this.setPlayerActive();

        this.timerStart();

    }

    getRandomNum(mn, mx){return Math.floor(Math.random() * (mx - mn + 1)) + mn;}    //나중에 유틸로 뺄 것

    initCardsNum(){
        const t = this;
        const players = ['player1', 'player2'];
        players.forEach(p => {
            for(let i = 0; i < 3; i++){
                t.data[p].cards[i] = t.getRandomNum(1, 12);
            }
        })
    }

    setCSS(){
        if(document.head.querySelector('style[data-css-name="timesWar"]')) return;

        const t = this;

        const style = document.createElement('style');
        style.dataset.cssName = 'timesWar';

        const cn = (nm) => `.${t.clssId + nm}`;

        style.textContent = `
            :root{
                --tile-margin-right: 0px;
                --tile-margin-bottom: 0px;
            }
            ${cn('wrapper')}{
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(to bottom, #000, #000070, #000);
                padding: 10px;
                box-sizing: border-box;
                pointer-events: initial;
            }
            ${cn('wrapper')}.freeze{
                pointer-events: none;
            }
                
            ${cn('inner-wrapper')}{
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, .1);
                box-sizing: border-box;
                perspective: 1000px;
            }
            ${cn('inner-wrapper2')}{
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                transition: transform 1s;
                background: linear-gradient(to bottom, #000, #000070, #000);
                box-shadow: inset 0 0 10px rgba(255, 255, 255, .5);
                padding: 5px;
                box-sizing: border-box;
            }
            ${cn('inner-wrapper2')}.effect{
                transform: rotateX(45deg) translateY(calc(-1 * var(--tile-size))) scale(0.95);
            }
            ${cn('player-interface')}{
                width: 100%;
                padding: 10px;
                border: 1px solid #fff;
                box-sizing: border-box;
            }
            ${cn('player-interface')}.active{
                box-shadow: 0 0 100px #fff;
                background: linear-gradient(135deg, #fff 12px, transparent 0);
                
            }
            ${cn('player-interface')} header{
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            ${cn('player-interface')} header h2{
                margin: 0;
                padding : 0;
                font-size: 20px;
                color: #fff;
                box-sizing: border-box;
            }
            ${cn('player-interface')} header .timer{
                width: 50px;
                height: 12px;
                background: #888;
                transition: background .1s;
            }
            ${cn('player-interface')} ul{
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                padding: 0;
                list-style: none;
            }
            ${cn('player-interface')} ul li{
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: calc(var(--tile-size) * .5);
                color: #fff;
                margin-right: 10px;
                border: 1px solid #fff;
                width: var(--tile-size);
                height: var(--tile-size);
                box-sizing: border-box;
                transition: background .8s, color .5s, transform .5s, opacity .8s;
                cursor: pointer;
                opacity: 1;
            }
            ${cn('player-interface')} ul li.active{
                background: #fff;
                color: #000;
                transform: rotate(-3deg);
            }
            ${cn('player-interface')} ul li.active.remove{
                transform: rotate(-3deg) translateY(-30px);
                opacity: 0;
            }
            ${cn('player-interface')} ul li:last-of-type{
                margin-right: 0;
            }
            ${cn('board-section')}{
                flex: 1;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: var(--board-margin);
            }
            ${cn('board-section')} > div{
                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                width: var(--board-size);
            }
            ${cn('board-section')} .tile{
                width: var(--tile-size);
                height: var(--tile-size);
                box-sizing: border-box;
                border: 1px solid #bbb;
                box-shadow: 0 0 5px rgba(255, 255, 255, .5);
                margin-right: var(--tile-margin-right);
                margin-bottom: var(--tile-margin-bottom);
                background: #000;
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: calc(var(--tile-size) * .5);
                position: relative;
            }
            ${cn('board-section')} .tile.mark{
                background: #ff0;
                color: #000;
                transform: rotate(5deg);
            }
        `;

        document.head.appendChild(style);
    }

    eventBinding(){
        const t = this;
        window.removeEventListener('resize', resizeTimesWar);
        window.addEventListener('resize', resizeTimesWar);

        function resizeTimesWar(){
            t.setTileSize();

        }
    }
    setClssId(){
        const t = this;
        t.clssId = 'times-war-';

        const char = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

        for(let i = 0; i < 10; i++){
            t.clssId += char[t.getRandomNum(0, char.length - 1)];
        }

        t.clssId += '-';
    }

    setData(type, idx, value){
        const t = this;
        t.data[type][idx] = value;
    }

    setUI(type, idx, value){
        if(type === 'board'){
            
        }else{
        }

    }

    setMode(){
        const t = this;
    }

    addClass(target, className){
        const t = this;
        target.classList.add(t.clssId + className);
    }

    setLayout(){
        const t = this;
        if(t.hasLayout) return;

        t.hasLayout = true;

        const wrapper = document.createElement('div');
        wrapper.classList.add(t.clssId + 'wrapper');
        

        const innerWrapper = document.createElement('div');
        const innerWrapper2 = document.createElement('div');
        const interface1 = document.createElement('div');
        const interface2 = document.createElement('div');
        const boardSection = document.createElement('div');

        t.addClass(innerWrapper, 'inner-wrapper');
        t.addClass(innerWrapper2, 'inner-wrapper2');
        t.addClass(interface1, 'player-interface');
        t.addClass(interface2, 'player-interface');
        t.addClass(boardSection, 'board-section');

        setTimeout(() => {
            innerWrapper2.classList.add('effect');
        })

        t.ui.wrapper = wrapper;
        t.ui.player1 = interface1;
        t.ui.player2 = interface2;
        t.ui.boardSection = boardSection;

        document.body.appendChild(wrapper);
        wrapper.appendChild(innerWrapper);
        innerWrapper.appendChild(innerWrapper2);
        innerWrapper2.appendChild(interface2);
        innerWrapper2.appendChild(boardSection);
        innerWrapper2.appendChild(interface1);

        t.setBoard();
        t.setPlayerInterface(1, 'player1');
        t.setPlayerInterface(2, 'player2');

    }
    setPlayerInterface(playerNum, playerId){
        const t = this;
        const header = document.createElement('header');
        const idTag = document.createElement('h2');
        const timer = document.createElement('div');
        const cardsList = document.createElement('ul');

        idTag.textContent = playerId;
        timer.classList.add('timer');
        timer.dataset.id = 'timer';

        for(let i = 0; i < 3; i++){
            const card = document.createElement('li');
            card.dataset.cardIdx = i;

            cardsList.appendChild(card);

            card.addEventListener('click', () => {
                if(+card.closest('[data-turn]').dataset.turn !== t.data.thisTurn) return;

                if(t.data.pickedIdx !== +card.dataset.cardIdx){
                    t.data.pickedIdx = +card.dataset.cardIdx;
                }else{
                    t.data.pickedIdx = undefined;
                };

                t.updatePlayerCardUI();
            })
        }

        t.ui['player' + playerNum].dataset.turn = playerNum;
        t.ui['player' + playerNum].appendChild(header);
        t.ui['player' + playerNum].appendChild(cardsList);
        header.appendChild(idTag);
        header.appendChild(timer);
    }

    updatePlayerCardUI(cmd = 'pick'){
        const t = this;

        if(cmd === 'pick'){
            t.ui['player' + t.data.thisTurn].querySelectorAll('[data-card-idx]').forEach((card, idx) => {
                card.classList.remove('active');
                if(idx === t.data.pickedIdx) card.classList.add('active');
            });
        }else if(cmd === 'setting'){
            const players = ['player1', 'player2'];
            players.forEach(p => {
                t.ui[p].querySelectorAll('[data-card-idx]').forEach((card, idx) => {
                    card.textContent = t.data[p].cards[idx];
                });
            })
        }
    }

    setTileSize(){  //쓴다
        const ww = window.innerWidth;
        const wh = window.innerHeight;

        const conf = {
            gap: 5, //타일간 간격
            wrapperPadding: 10, //전체 패딩
            innerPadding: 5, //안쪽 패딩
            interfacePadding: 120,  //위 아래 인터페이스의 남은 여백(2세트)
            boardOuterPadding: 40   //보드 위아래 간격(2세트)
        }

        const cstmW = (ww - (conf.gap * 6) - conf.wrapperPadding - conf.innerPadding);
        const cstmH = (wh - (conf.gap * 4) - conf.wrapperPadding - conf.innerPadding - conf.interfacePadding - conf.boardOuterPadding);

        const tileSize = (cstmW / 5) > (cstmH / 7) ? (cstmH / 7) : (cstmW / 5);

        this.ui.wrapper.style.setProperty('--board-margin', `${conf.boardOuterPadding / 2}px 0`);
        this.ui.wrapper.style.setProperty('--tile-size', tileSize + 'px');
        this.ui.wrapper.style.setProperty('--board-size', ((tileSize * 5) + (conf.gap * 6)) + 'px');
    }

    setBoard(col = 5, row = 5, gap = 5){    //쓴다
        const t = this;
        const board = document.createElement('div');
        board.id = 'boardWrapper';
        board.dataset.size = `${col}*${row}`;
        
        for(let i = 0; i < row; i++){
            for(let j = 0; j < col; j++){
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.dataset.tileIdx = (i * 5) + j;
                tile.style.setProperty('--tile-margin-right', (j === (col - 1) ? 0 : gap) + 'px');
                tile.style.setProperty('--tile-margin-bottom', (i === (row - 1) ? 0 : gap) + 'px');

                board.appendChild(tile);

                tile.addEventListener('click', () => {
                    if(t.data.pickedIdx === undefined) return;

                    t.ui.wrapper.classList.add('freeze');

                    const cardNum = t.data['player' + t.data.thisTurn].cards[t.data.pickedIdx];

                    t.calcTileVal(tile.dataset.tileIdx, cardNum);
                    t.updateBoardUI(tile.dataset.tileIdx);
                    t.effectTile(tile.dataset.tileIdx);

                    if(t.chkWinCase(+tile.dataset.tileIdx)){
                        t.data.wonTiles.forEach((tileIdx) => {
                            t.ui.boardSection.querySelector('[data-tile-idx="' + tileIdx + '"]').classList.add('mark');
                        })

                        this.ui.wrapper.classList.add('freeze');
                        window.cancelAnimationFrame(this.data.timer.raf);

                        return;
                    };


                    t.switchTurn();
                    t.timerStart();

                })
            }
        }

        this.ui.boardSection.appendChild(board);
    }

    /**
     * board의 tile위치의 값 할당
     * @param {number} tileIdx 타일넘버(0~24)
     * @param {number} val 고른 카드의 숫자(1~12)
     */
    calcTileVal(tileIdx, val){
        const t = this;
        const oldVal = t.data.board[tileIdx];

        if(oldVal === ''){
            t.data.board[tileIdx] = +val;
        }else{
            t.data.board[tileIdx] = (t.data.board[tileIdx] + +val) % 12;
            if(t.data.board[tileIdx] === 0) t.data.board[tileIdx] = 12;
        }
    }

    /**
     * board의 있는 모든 값들을 실제 board의 세팅(tileIdx가 있을 경우 그건 따로 효과)
     * @param {number} tileIdx 타일넘버(0~24) 
     */
    updateBoardUI(tileIdx){
        const t = this;
        t.ui.boardSection.querySelectorAll('[data-tile-idx]').forEach((tile, idx) => {
            tile.textContent = t.data.board[idx];
        })

        if(tileIdx !== undefined){
            const effectDiv = document.createElement('div');
        }
    }

    
    /**
     * 해당 타일에 effect효과를 부여
     * @param {number} tileIdx tileIdx 타일넘버(0~24) 
     * @param {number} effectType 나중에 쓸 예정(준비중)
     */
    effectTile(tileIdx, effectType, opt){
        const t = this;
        const targetTile = t.ui.boardSection.querySelectorAll('[data-tile-idx]')[tileIdx];

        if(!effectType){
            const effect = document.createElement('div');

            effect.textContent = t.data['player' + t.data.thisTurn].cards[t.data.pickedIdx];

            effect.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #fff;
                box-shadow: 0 0 12px #fff;
                transition: transform .5s, opacity .8s;
                transform: scale(3) translateY(-10px) rotate(45deg);
                color: #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: calc(var(--tile-size) * .5);
            `;

            setTimeout(() => {
                effect.style.transform = 'scale(1)';
                effect.style.opacity = 0;
            })
            
            effect.addEventListener('transitionend', () => {
                effect.remove();
                if(opt && opt.callback && typeof opt.callback === 'function') opt.callback();
            })

            targetTile.appendChild(effect);
        }
    }

    /**
     * turn을 바꿈(1 혹은 2)
     */
    async switchTurn(){
        const newNum =  await this.setNewCard();
        this.data.pickedIdx = undefined;
        this.data.thisTurn = this.data.thisTurn === 1 ? 2 : 1;
        this.ui.wrapper.classList.remove('freeze');
        this.setPlayerActive();
        return;
    }

    setPlayerActive(){
        for(let i = 0; i < 2; i++){
            this.ui['player' + (i + 1)].classList.remove('active');
            if(this.data.thisTurn === i + 1) this.ui['player' + this.data.thisTurn].classList.add('active');
        }
    }

    /**
     * 카드 재발급
     */
    setNewCard(){
        return new Promise((resolve) => {

            const d = this.data;
            const removeCard = this.ui['player' + d.thisTurn].querySelectorAll('[data-card-idx]')[d.pickedIdx];
            removeCard.classList.add('remove');
            removeCard.addEventListener('transitionend', (e) => {
                const rdmNum = this.getRandomNum(1, 12);
                removeCard.textContent = rdmNum;
                d['player' + d.thisTurn].cards[d.pickedIdx] = rdmNum;
                removeCard.removeAttribute('class');

                resolve(rdmNum);
            }, {once: true})
        })
    }

    chkWinCase(tileIdx){
        let rtnVal =false;

        //가로세로
        if(this.checkGS(tileIdx, 'g')) rtnVal = true;
        if(this.checkGS(tileIdx, 's')) rtnVal = true;
        if(this.checkX(tileIdx, '0130')) rtnVal = true;
        if(this.checkX(tileIdx, '0430')) rtnVal = true;

        return rtnVal;
    }

    /**
     * 가로세로 체크 후 맞는 값이 있으면 return
     * @param {number} tileIdx 마지막으로 클릭한 타일의 idx
     * @param {string} type g: 가로, s: 세로
     * @returns bool
     */
    checkGS(tileIdx, type = 'g'){
        let rtnVal = false;
    
        const d = idx => !this.data.board[idx] ? '' : +this.data.board[idx];

        const row = parseInt(tileIdx / 5);
        const col = tileIdx % 5;
    
        const adjVal = (val) => {
            const adjRow = row + (type === 'g' ? 0 : val);
            const adjCol = col + (type === 'g' ? val : 0);

            if(4 < adjRow || adjRow < 0) return;
            if(4 < adjCol || adjCol < 0) return;

            return (adjRow * 5) + adjCol;
        }
    
        let intervalNull = false;
    
        const tile_2 = d(adjVal(-2));
        const tile_1 = d(adjVal(-1));
        const tile0 = d(adjVal(0));
        const tile1 = d(adjVal(1));
        const tile2 = d(adjVal(2));

        if(tile_2 && tile_1){
            if((tile_2 === tile_1 && tile_1 === tile0)
            || (tile_2 - 1 === tile_1 && tile_1 === tile0 + 1)
            || (tile_2 + 1 === tile_1 && tile_1 === tile0 - 1)){
                this.data.wonTiles = [adjVal(-2), adjVal(-1), adjVal(0)];
                rtnVal = true;
            }
        }else{
            if(tile_1 === '') intervalNull = true;
        }
    
        if(tile1 && tile2){
            if((tile0 === tile1 && tile1 === tile2)
            || (tile0 - 1 === tile1 && tile1 === tile2 + 1)
            || (tile0 + 1 === tile1 && tile1 === tile2 - 1)){
                this.data.wonTiles = [adjVal(0), adjVal(1), adjVal(2)];
                rtnVal = true;
            }
        }else{
            if(tile1 === '') intervalNull = true;
        }
    
        if(!intervalNull && tile_1 && tile1){
            if((tile_1 === tile0 && tile0 === tile1)
            || (tile_1 - 1 === tile0 && tile0 === tile1 + 1)
            || (tile_1 + 1 === tile0 && tile0 === tile1 - 1)){
                this.data.wonTiles = [adjVal(-1), adjVal(0), adjVal(1)];
                rtnVal = true;
            }
        }
    
        return rtnVal;
    }

    /**
     * 
     * @param {number} tileIdx 마지막으로 클릭한 타일의 idx
     * @param {string} dir 0130: 1시30분방향(시침), 0430: 4시30분방향(시침)
     * @returns 
     */
    checkX(tileIdx, dir = '0130'){
        let rtnVal = false;

        const d = idx => !this.data.board[idx] ? '' : +this.data.board[idx];

        const row = parseInt(tileIdx / 5);
        const col = tileIdx % 5;

        const adjVal = (val) => {
            const adjRow = row + val;
            const adjCol = col + (val * (dir === '0130' ? -1 : 1));

            if(4 < adjRow || adjRow < 0) return;
            if(4 < adjCol || adjCol < 0) return;

            return (adjRow * 5) + adjCol;
        }

        let intervalNull = false;

        const tile_2 = d(adjVal(-2));
        const tile_1 = d(adjVal(-1));
        const tile0 = d(adjVal(0));
        const tile1 = d(adjVal(1));
        const tile2 = d(adjVal(2));

        // console.log(dir, tile_2, tile_1, tile0, tile1, tile2);

        if(tile_2 && tile_1){ //좌상, 우상
            if((tile_2 === tile_1 && tile_1 === tile0)
            || (tile_2 - 1 === tile_1 && tile_1 === tile0 + 1)
            || (tile_2 + 1 === tile_1 && tile_1 === tile0 - 1)){
                this.data.wonTiles = [adjVal(-2), adjVal(-1), adjVal(0)];
                rtnVal = true;
            }
        }else{
            if(tile_1 === '') intervalNull = true;
        }
        
        if(tile1 && tile2){ //좌하, 우하
            if((tile0 === tile1 && tile1 === tile2)
            || (tile0 - 1 === tile1 && tile1 === tile2 + 1)
            || (tile0 + 1 === tile1 && tile1 === tile2 - 1)){
                this.data.wonTiles = [adjVal(0), adjVal(1), adjVal(2)];
                rtnVal = true;
            }
        }else{
            if(tile1 === '') intervalNull = true;
        }

        if(!intervalNull && tile_1  && tile1){
            if((tile_1 === tile0 && tile0 === tile1)
            || (tile_1 - 1 === tile0 && tile0 === tile1 + 1)
            || (tile_1 + 1 === tile0 && tile0 === tile1 - 1)){
                this.data.wonTiles = [adjVal(-1), adjVal(0), adjVal(1)];
                rtnVal = true;
            }
        }

        return rtnVal;
    }

    timerStart(){
        this.data.timer.startTime = performance.now();
        console.log(this.data.timer.startTime);
        console.log(this.data.timer.duration)
        this.timer();
    }
    
    timer = (currTime) => {
        const {duration, startTime} = this.data.timer;
        const target = this.ui['player' + this.data.thisTurn].querySelector('[data-id="timer"]');
        const otherTarget = this.ui['player' + (this.data.thisTurn === 1 ? 2 : 1)].querySelector('[data-id="timer"]');
        
        if(!currTime || currTime - startTime < duration){
            
            otherTarget.style.background = '#888';
            const color = duration - (currTime - startTime) <= 10 * 1000 ? '#f00' : '#fff';

            const backgroundStyle = `linear-gradient(to right, ${color} ${(1 - ((currTime - startTime) / duration)) * 100}%, #888 0)`;
            target.style.background = backgroundStyle;

            this.data.timer.raf = window.requestAnimationFrame(this.timer);
        }else{
            window.cancelAnimationFrame(this.data.timer.raf);
            this.autoAction();
        }
    }

    autoAction(){
        if(!this.data.pickedIdx) this.data.pickedIdx = this.getRandomNum(0, 2);
        this.updatePlayerCardUI();
        this.ui.boardSection.querySelectorAll('[data-tile-idx]')[this.getRandomNum(0, 24)].click();
    }
}