const effectObj = {
    effect1: {  //파란 애디션
        tmpl: (oldNum, newNum, changedNum) => {
            const tmpl = document.createElement('div');
            tmpl.classList.add('num-wrapper');
            tmpl.classList.add('effect1');
            tmpl.innerHTML = `
                <div class="num">${changedNum}</div>
                <div class="effect-obj1">
                    <div class="effect-obj1-1" style="box-shadow: 0 0 5px blue, inset 0 0 10px blue;"></div>
                </div>
            `;
            return tmpl;
        }
    },
    effect2: {  //랜덤컬러 무지개 에디션
        tmpl: (oldNum, newNum, changedNum) => {
            const colorArr = ['red', 'orange', 'yellow', 'green', 'blue', 'navy', 'purple'];
            const color = colorArr[getRandomNum(0, colorArr.length - 1)];
            
            function getRandomNum(mn, mx){return Math.floor(Math.random() * (mx - mn + 1)) + mn;};
            const tmpl = document.createElement('div');
            tmpl.classList.add('num-wrapper');
            tmpl.classList.add('effect2');
            tmpl.innerHTML = `
                <div class="num">${changedNum}</div>
                <div class="effect-obj1">
                    <div class="effect-obj1-1" style="box-shadow: 0 0 5px ${color}, inset 0 0 10px ${color};"></div>
                </div>
            `;
            return tmpl;
        }
    },
    effect3: { 
        tmpl: (oldNum, newNum, changedNum) => {
            const tmpl = document.createElement('div');
            tmpl.classList.add('num-wrapper');
            tmpl.classList.add('effect3');
            tmpl.innerHTML = `
            <div class="effect-obj1 num">${changedNum}</div>
            <div class="effect-obj2 num">${oldNum}</div>
            `;
            return tmpl;
        }
    },
    effect4: { 
        tmpl: (oldNum, newNum, changedNum) => {
            const tmpl = document.createElement('div');
            tmpl.classList.add('num-wrapper');
            tmpl.classList.add('effect4');
            tmpl.innerHTML = `<div class="effect-obj1 num">${changedNum}</div>`;
            return tmpl;
        }
    },
    effect5: { 
        tmpl: (oldNum, newNum, changedNum) => {
            const tmpl = document.createElement('div');
            tmpl.classList.add('num-wrapper');
            tmpl.classList.add('effect5');
            tmpl.innerHTML = `<div class="effect-obj1 num">${changedNum}</div>`;
            return tmpl;
        }
    },
    effect6: { 
        tmpl: (oldNum, newNum, changedNum) => {
            function getRandomNum(mn, mx){return Math.floor(Math.random() * (mx - mn + 1)) + mn;};
            const plma = [1, -1];
            const x = getRandomNum(10, 200) * plma[getRandomNum(0, 1)];
            const y = getRandomNum(10, 200) * plma[getRandomNum(0, 1)];
            const tmpl = document.createElement('div');
            tmpl.classList.add('num-wrapper');
            tmpl.classList.add('effect6');
            tmpl.innerHTML = `
                <div class="effect-obj1 num" style="transform: translate(${x}%, ${y}%);">${newNum}</div>
                <div class="effect-obj2 num">${oldNum}</div>
                <div class="effect-obj3 num">${changedNum}</div>
            `;
            return tmpl;
        }
    },
    effect7: {  //시계 
        tmpl: (oldNum, newNum, changedNum) => {
            const tmpl = document.createElement('div');
            tmpl.classList.add('num-wrapper');
            tmpl.classList.add('effect7');
            tmpl.innerHTML = `
                <div class="effect-obj1 num">
                    <div class="tics">
                        <div>'</div><div>'</div><div>'</div><div>'</div>
                        <div>'</div><div>'</div><div>'</div><div>'</div>
                        <div>'</div><div>'</div><div>'</div><div>'</div>
                    </div>
                    <div class="hands">
                        <div class="hand-h" style="transform: rotate(${(+oldNum === 12 ? 0 : oldNum) * 30}deg);"></div>
                        <div class="hand-m" style="transform: rotate(0deg);"></div>
                    </div>
                </div>
                <div class="digital-num ${changedNum > 6 ? 'left-side' : 'right-side'}">${changedNum}</div>
            `;
            return tmpl;
        }
    },
}

// function getRandomNum(mn, mx){return Math.floor(Math.random() * (mx - mn + 1)) + mn;};
// const qs = function(t){return document.querySelector(t);}
// const qsa = function(t){return document.querySelectorAll(t);}



