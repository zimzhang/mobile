/**
 * $.alphaTable - a list table for App Framework apps
 *
 * @copyright 2011 - Intel
 *
 */ (function($) {
    $.fn["alphatable"] = function(scroller, opts) {
        var tmp;
        for (var i = 0; i < this.length; i++) {
            tmp = new alphaTable(this[i], scroller, opts);
 
        }
        return this.length == 1 ? tmp : this;
    };
 
    var alphaTable = (function() {
        var translateOpen = $.feat.cssTransformStart;
        var translateClose = $.feat.cssTransformEnd;
        var alphaTable = function(el, scroller, opts) {
 
            if (typeof el == "string") el = document.getElementById(el);
            this.container = el.parentNode;
            if (!this.container) {
                alert("Error finding container for alphaTable " + el);
                return;
            }
            if (this instanceof alphaTable) {
                for (j in opts) {
                    this[j] = opts[j];
                }
            } else {
                return new alphaTable(el, scroller, opts);
            }
            if (!scroller || typeof(scroller) != "object") {
                return alert("Error: Please include an af.scroll object to use this");
            }
            this.scroller = scroller;
 
            this.el = el;
 
            this.setupIndex();
            var stickyHeader = $.create("div", {
                className: "stickyHeader tableHeader",
                html: $(this.el).find(".tableHeader").html()
            });
            stickyHeader.get(0).style.cssText = ";z-index:9998;position:absolute;top:0px;width:100%;";
 
            $(this.el).parent().append(stickyHeader);
            this.header = stickyHeader;
            this.setupLetterBox();
            var that = this;
 
            var prevPos = this.scroller.scrollTop;
            var isMoving = false;
            this.el.addEventListener("touchmove", function(e) {
                var thePos = that.scroller.scrollTop;
                if (that.scroller.scrollTop > 0) return;
                thePos = Math.abs(thePos);
                if (!isMoving) {
                    for (var i = 0; i < that.offset.length; i++) {
                        var checkPos = that.offset[i];
                        var checkPosSuc = that.offset[i+1]; //
                    if(checkPosSuc==undefined)checkPosSuc = 1000000000000;
                        if (checkPos >= (thePos) && checkPos <= (thePos + that.boxHeight)) {
                            isMoving = i;
                            break;
                        }
                        else if(thePos > checkPos && thePos < (checkPosSuc-that.boxHeight) ){
                            isMoving = i;
                            break;
                        }
                    }
                }
                var dir = thePos > prevPos;
                prevPos = thePos;
                if (isMoving >= 0) {
                    checkPos = that.offset[isMoving];
                    var moveTo = (thePos - checkPos) + that.boxHeight;
                    moveTo *= -1;
                    if (moveTo >= 0) {
                        if(isMoving > 0 )that.header.html($(that.el).find(".tableHeader").get(isMoving - 1).innerHTML);
                        else if(isMoving == 0 )that.header.html($(that.el).find(".tableHeader").get(isMoving).innerHTML);
                        isMoving = false;
                    } else if (Math.abs(moveTo) >= Math.abs(that.boxHeight)) {
                        that.header.html($(that.el).find(".tableHeader").get(isMoving).innerHTML);
                        isMoving = false;
                        moveTo = 0;
                    }
                    that.header.cssTranslate("0," + moveTo + "px");
                    return;
                }
                that.header.cssTranslate("0,0");
            });
            this.getOffsets();
            this.boxHeight = numOnly(stickyHeader.computedStyle("height"));
 
        };
        var boxCSS = "position:absolute;top:5%;right:10px;width:20px;font-size:6pt;font-weight:bold;color:#000;opacity:.5;border-radius:5px;text-align:center;z-index:9999;border:1px solid black;background:#666;padding-top:5px;padding-bottom:5px;height:90%;";
        alphaTable.prototype = {
            listCssClass: "",
            letterBox: null,
            isMoving: false,
            prefix: "",
            offsets: [],
            boxHeight: 0,
            refresh: function() {
                this.getOffsets();
            },
            getOffsets: function() {
                var that = this;
                var parentTop = $(this.el.parentNode).offset().top;
                console.log(parentTop);
                var stuff = $(this.el).find(".tableHeader");
                that.offset = [];
                stuff.each(function() {
                    that.offset.push($(this).offset().top - parentTop);
                });
            },
            scrollToLetter: function(letter) {
                var el = document.getElementById(this.prefix + letter);
                if (el) {
                    var yPos = -el.offsetTop;
                    this.scroller.scrollTo({
                        x: 0,
                        y: yPos
                    });
                }
            },
            setupIndex: function() {
                var arrAlphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
                var that = this;
                var containerDiv = document.createElement("div");
                containerDiv.id = "indexDIV_" + this.el.id;
                containerDiv.style.cssText = boxCSS;
                containerDiv.className = this.listCssClass;
                containerDiv.addEventListener("touchend", function(event) {
                    that.isMoving = false;
                    that.clearLetterBox();
                }, false);
                //To allow updating as we "scroll" with our finger, we need to capture the position on the containerDiv element and calculate the Y coordinates.
                //On mobile devices, you can not do an "onmouseover" over multiple items and trigger events.
                containerDiv.addEventListener("touchstart", function(event) {
 
 
                    if (event.touches[0].target == this) return;
                    that.isMoving = true;
 
                    var letter = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
                    if (!letter || !letter.getAttribute("alphatable-item") || letter.getAttribute("alphatable-item").length == 0)
                        var letter = event.touches[0].target;
 
                    if (letter.innerHTML.length > 1) return;
                    that.showLetter(letter.innerHTML);
                    that.scrollToLetter(letter.innerHTML);
                    event.preventDefault();
                    event.stopPropagation();
                }, false);
                containerDiv.addEventListener("touchmove", function(event) {
                    var letter = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
                    if (!letter || !letter.getAttribute("alphatable-item") || letter.getAttribute("alphatable-item").length == 0)
                        var letter = event.touches[0].target;
                    if (letter.innerHTML.length > 1) return;
                    if (!that.isMoving) return;
                    that.showLetter(letter.innerHTML);
                    that.scrollToLetter(letter.innerHTML);
                    event.preventDefault();
                }, false);
 
                //Create the alphabet
                for (i = 0; i < arrAlphabet.length; i++) {
                    var tmpDiv = document.createElement("div");
                    tmpDiv.innerHTML = arrAlphabet[i];
                    tmpDiv.setAttribute("alphatable-item", "true");
                    containerDiv.appendChild(tmpDiv);
                }
                this.container.appendChild(containerDiv);
 
                var clientHeight = numOnly(containerDiv.clientHeight) - numOnly(containerDiv.style.top) - numOnly(containerDiv.style.paddingTop);
                this.scroller.scrollTo({
                    x: 0,
                    y: 0
                }); //There's a bug with webkit and css3.  The letterbox would not show until -webkit-transform as applied.
                containerDiv = null;
 
            },
            showLetter: function(letter) {
                var that = this;
                this.letterBox.style.display = "block";
                if (this.letterBox.innerHTML != letter) {
                    that.letterBox.innerHTML = letter;
                }
 
            },
            clearLetterBox: function() {
                this.letterBox.style.display = "none";
                this.letterBox.innerHTML = "";
            },
            setupLetterBox: function() {
                var div = document.createElement("div");
                div.style.cssText = $.feat.cssPrefix + "-transform:translate3d(0,0,0);display:none;position:absolute;top:35%;left:35%;height:2em;width:15%;line-height:2em;text-align:center;font-size:2em;color:blue;background:#666;z-index:999999;border:1px solid black;border-raidus:10px;";
                div.className = this.letterBoxCssClass;
                div.innerHTML = "";
                this.letterBox = div;
                this.container.appendChild(div);
                div = null;
 
            }
        };
        return alphaTable;
    })();
})(af);