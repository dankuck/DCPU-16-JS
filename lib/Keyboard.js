(function(window) {
    var keyMap = {
        8: 0x10,
        13: 0x11,
        45: 0x12,
        46: 0x13,
        38: 0x80,
        40: 0x81,
        37: 0x82,
        39: 0x83,
        16: 0x90,
        17: 0x91,
        128: 0x80,
        129: 0x81,
        130: 0x82,
        131: 0x83
    };

    function Keyboard(container) {
        this.id = 0x30cf7406;
        this.version = 1;
        this.manufacturer = 0;

        this.buffer = [];
        this.keysDown = [];
        this.keyInterrupts = 0;

        this.container = container;
        this.DOMListeners = [];
        
    }
    
    Keyboard.prototype.setupEvents = function(){
        var self = this;
        
        this.acceptKeys = true;
    
        this.addDOMListener(document, 'keydown', function(e) {
            if(self.acceptKeys && self.cpu.running && e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA') {
                var key = keyMap[e.which] || e.which;
                self.keysDown[key] = Date.now();
                
                self.buffer.push(key);
                self.keyEvent(key);
                
                if (e.which >= 37 && e.which <= 40 || e.which === 8 || e.which === 33 || e.which === 34) 
                    e.preventDefault();
            }
        });
        
        this.addDOMListener(document, 'keyup', function(e) {
            if(self.acceptKeys && self.cpu.running && e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA') {
                var key = keyMap[e.which] || e.which;
                self.keysDown[key] = 0;
                
                self.keyEvent(key);
            }
        });
        
        this.addDOMListener(document, 'keypress', function(e) {
            if(self.acceptKeys && self.cpu.running && e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA') {
                var key = keyMap[e.which] || e.which;
                self.buffer.push(key);
                self.keyEvent(key);
                e.preventDefault();
            }
        });
        
        if (this.container){
            self.acceptKeys = false;
            
            this.addDOMListener(this.container, 'mouseover', function(e){
                self.acceptKeys = true;
            });
            
            this.addDOMListener(this.container, 'mouseout', function(e){
                self.acceptKeys = false;
            });
        }
    };
    
    Keyboard.prototype.onConnect = function(cpu) {
        this.cpu = cpu;
        this.setupEvents();
        this.startLoop();
    };
    
    Keyboard.prototype.addDOMListener = function(element, event_name, func){
        element.addEventListener(event_name, func);
        this.DOMListeners.push({element: element, event_name: event_name, func: func});
    };
    
    Keyboard.prototype.onDisconnect = function(){
        this.stopLoop();
    	this.unsetEvents();
        delete this.cpu;
    };
    
    Keyboard.prototype.unsetEvents = function(){
        for (var i = 0; i < this.DOMListeners.length; i++)
            this.DOMListeners[i].element.removeEventListener(this.DOMListeners[i].event_name, this.DOMListeners[i].func);
        this.DOMListeners = [];
    };
    
    Keyboard.prototype.onInterrupt = function(callback) {
        switch(this.cpu.mem.a) {
            case 0:
                this.buffer = [];
                break;
            
            case 1:
                var k = this.buffer.shift() || 0;
                this.cpu.set('c',  k);
                break;
                
            case 2:
                this.cpu.set('c', Number(this.keysDown[this.cpu.mem.b] !== 0));
                break;
                
            case 3:
                this.keyInterrupts = this.cpu.mem.b;
                break;
        }
        callback();
    };

    Keyboard.prototype.keyEvent = function(key) {
        if(this.keyInterrupts) {
            this.cpu.interrupt(keyInterrupts);
        }
    };

    Keyboard.prototype.startLoop = function() {
        var self = this;
        if (this.looper)
        	clearInterval(this.looper);
        var pressListeners = [];
        this.looper = setInterval(function(){
	        if(self.cpu.running) {
	            var now = Date.now();
	            for(var i = 0; i < pressListeners.length; i++) {
	                if(self.keysDown[pressListeners[i]] && now - self.keysDown[pressListeners[i]] > 500) 
	                	self.buffer.push(pressListeners[i]);
	            }
	        } 
        }, 10);
    };
    
    Keyboard.prototype.stopLoop = function(){
    	if (! this.looper)
    		return;
    	clearInterval(this.looper);
    	delete this.looper;
    };

    window.Keyboard = Keyboard;
})(window);
