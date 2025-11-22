jQuery(document).ready(function($){
  
    //variables
    var hijacking= $('body').data('hijacking'),
        animationType = $('body').data('animation'),
        delta = 0,
        scrollThreshold = 5,
        actual = 1,
        animating = false;
    
    //DOM elements
    var sectionsAvailable = $('.cd-section'),
        verticalNav = $('.cd-vertical-nav'),
        prevArrow = verticalNav.find('a.cd-prev'),
        nextArrow = verticalNav.find('a.cd-next');

    
    //check the media query and bind corresponding events
    var MQ = deviceType(),
        bindToggle = false;
    
    bindEvents(MQ, true);
    
    $(window).on('resize', function(){
        MQ = deviceType();
        bindEvents(MQ, bindToggle);
        if( MQ == 'mobile' ) bindToggle = true;
        if( MQ == 'desktop' ) bindToggle = false;
    });

    function bindEvents(MQ, bool) {
        
        if( MQ == 'desktop' && bool) {          
            //bind the animation to the window scroll event, arrows click and keyboard
            if( hijacking == 'on' ) {
                initHijacking();
                $(window).on('DOMMouseScroll mousewheel', scrollHijacking);
            } else {
                scrollAnimation();
                $(window).on('scroll', scrollAnimation);
            }
            prevArrow.on('click', prevSection);
            nextArrow.on('click', nextSection);
            
            $(document).on('keydown', function(event){
                if( event.which=='40' && !nextArrow.hasClass('inactive') ) {
                    event.preventDefault();
                    nextSection();
                } else if( event.which=='38' && (!prevArrow.hasClass('inactive') || (prevArrow.hasClass('inactive') && $(window).scrollTop() != sectionsAvailable.eq(0).offset().top) ) ) {
                    event.preventDefault();
                    prevSection();
                }
            });
            //set navigation arrows visibility
            checkNavigation();
        } else if( MQ == 'mobile' ) {
            //reset and unbind
            resetSectionStyle();
            $(window).off('DOMMouseScroll mousewheel', scrollHijacking);
            $(window).off('scroll', scrollAnimation);
            prevArrow.off('click', prevSection);
            nextArrow.off('click', nextSection);
            $(document).off('keydown');
        }
    }

    function scrollAnimation(){
        //normal scroll - use requestAnimationFrame (if defined) to optimize performance
        (!window.requestAnimationFrame) ? animateSection() : window.requestAnimationFrame(animateSection);
    }

    function animateSection() {
        var scrollTop = $(window).scrollTop(),
            windowHeight = $(window).height(),
            windowWidth = $(window).width();
        
        sectionsAvailable.each(function(){
            var actualBlock = $(this),
                offset = scrollTop - actualBlock.offset().top;

            //according to animation type and window scroll, define animation parameters
            var animationValues = setSectionAnimation(offset, windowHeight, animationType);
            
            transformSection(actualBlock.children('div'), animationValues[0], animationValues[1], animationValues[2], animationValues[3], animationValues[4]);
            ( offset >= 0 && offset < windowHeight ) ? actualBlock.addClass('visible') : actualBlock.removeClass('visible');        
        });
        
        checkNavigation();
    }

    function transformSection(element, translateY, scaleValue, rotateXValue, opacityValue, boxShadow) {
        //transform sections - normal scroll
        element.velocity({
            translateY: translateY+'vh',
            scale: scaleValue,
            rotateX: rotateXValue,
            opacity: opacityValue,
            boxShadowBlur: boxShadow+'px',
            translateZ: 0,
        }, 0);
    }

    function initHijacking() {
        // initialize section style - scrollhijacking
        var visibleSection = sectionsAvailable.filter('.visible'),
            topSection = visibleSection.prevAll('.cd-section'),
            bottomSection = visibleSection.nextAll('.cd-section'),
            animationParams = selectAnimation(animationType, false),
            animationVisible = animationParams[0],
            animationTop = animationParams[1],
            animationBottom = animationParams[2];

        visibleSection.children('div').velocity(animationVisible, 1, function(){
            visibleSection.css('opacity', 1);
            topSection.css('opacity', 1);
            bottomSection.css('opacity', 1);
        });
        topSection.children('div').velocity(animationTop, 0);
        bottomSection.children('div').velocity(animationBottom, 0);
    }

    function scrollHijacking (event) {
        // on mouse scroll - check if animate section
        if (event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0) { 
            delta--;
            ( Math.abs(delta) >= scrollThreshold) && prevSection();
        } else {
            delta++;
            (delta >= scrollThreshold) && nextSection();
        }
        return false;
    }

    function prevSection(event) {
        //go to previous section
        typeof event !== 'undefined' && event.preventDefault();
        
        var visibleSection = sectionsAvailable.filter('.visible'),
            middleScroll = ( hijacking == 'off' && $(window).scrollTop() != visibleSection.offset().top) ? true : false;
        visibleSection = middleScroll ? visibleSection.next('.cd-section') : visibleSection;

        var animationParams = selectAnimation(animationType, middleScroll, 'prev');
        unbindScroll(visibleSection.prev('.cd-section'), animationParams[3]);

        if( !animating && !visibleSection.is(":first-child") ) {
            animating = true;
            visibleSection.removeClass('visible').children('div').velocity(animationParams[2], animationParams[3], animationParams[4])
            .end().prev('.cd-section').addClass('visible').children('div').velocity(animationParams[0] , animationParams[3], animationParams[4], function(){
                animating = false;
                if( hijacking == 'off') $(window).on('scroll', scrollAnimation);
            });
            
            actual = actual - 1;
        }

        resetScroll();
    }

    function nextSection(event) {
        //go to next section
        typeof event !== 'undefined' && event.preventDefault();

        var visibleSection = sectionsAvailable.filter('.visible'),
            middleScroll = ( hijacking == 'off' && $(window).scrollTop() != visibleSection.offset().top) ? true : false;

        var animationParams = selectAnimation(animationType, middleScroll, 'next');
        unbindScroll(visibleSection.next('.cd-section'), animationParams[3]);

        if(!animating && !visibleSection.is(":last-of-type") ) {
            animating = true;
            visibleSection.removeClass('visible').children('div').velocity(animationParams[1], animationParams[3], animationParams[4] )
            .end().next('.cd-section').addClass('visible').children('div').velocity(animationParams[0], animationParams[3], animationParams[4], function(){
                animating = false;
                if( hijacking == 'off') $(window).on('scroll', scrollAnimation);
            });

            actual = actual +1;
        }
        resetScroll();
    }

    function unbindScroll(section, time) {
        //if clicking on navigation - unbind scroll and animate using custom velocity animation
        if( hijacking == 'off') {
            $(window).off('scroll', scrollAnimation);
            ( animationType == 'catch') ? $('body, html').scrollTop(section.offset().top) : section.velocity("scroll", { duration: time });
        }
    }

    function resetScroll() {
        delta = 0;
        checkNavigation();
    }

    function checkNavigation() {
        //update navigation arrows visibility
        ( sectionsAvailable.filter('.visible').is(':first-of-type') ) ? prevArrow.addClass('inactive') : prevArrow.removeClass('inactive');
        ( sectionsAvailable.filter('.visible').is(':last-of-type')  ) ? nextArrow.addClass('inactive') : nextArrow.removeClass('inactive');
    }

    function resetSectionStyle() {
        //on mobile - remove style applied with jQuery
        sectionsAvailable.children('div').each(function(){
            $(this).attr('style', '');
        });
    }

    function deviceType() {
        //detect if desktop/mobile
        return window.getComputedStyle(document.querySelector('body'), '::before').getPropertyValue('content').replace(/"/g, "").replace(/'/g, "");
    }

    function selectAnimation(animationName, middleScroll, direction) {
        // select section animation - scrollhijacking
        var animationVisible = 'translateNone',
            animationTop = 'translateUp',
            animationBottom = 'translateDown',
            easing = 'ease',
            animDuration = 800;

        switch(animationName) {
            case 'scaleDown':
                animationTop = 'scaleDown';
                easing = 'easeInCubic';
                break;
            case 'rotate':
                if( hijacking == 'off') {
                    animationTop = 'rotation.scroll';
                    animationBottom = 'translateNone';
                } else {
                    animationTop = 'rotation';
                    easing = 'easeInCubic';
                }
                break;
            case 'gallery':
                animDuration = 1500;
                if( middleScroll ) {
                    animationTop = 'scaleDown.moveUp.scroll';
                    animationVisible = 'scaleUp.moveUp.scroll';
                    animationBottom = 'scaleDown.moveDown.scroll';
                } else {
                    animationVisible = (direction == 'next') ? 'scaleUp.moveUp' : 'scaleUp.moveDown';
                    animationTop = 'scaleDown.moveUp';
                    animationBottom = 'scaleDown.moveDown';
                }
                break;
            case 'catch':
                animationVisible = 'translateUp.delay';
                break;
            case 'opacity':
                animDuration = 700;
                animationTop = 'hide.scaleUp';
                animationBottom = 'hide.scaleDown';
                break;
            case 'fixed':
                animationTop = 'translateNone';
                easing = 'easeInCubic';
                break;
            case 'parallax':
                animationTop = 'translateUp.half';
                easing = 'easeInCubic';
                break;
        }

        return [animationVisible, animationTop, animationBottom, animDuration, easing];
    }

    function setSectionAnimation(sectionOffset, windowHeight, animationName ) {
        // select section animation - normal scroll
        var scale = 1,
            translateY = 100,
            rotateX = '0deg',
            opacity = 1,
            boxShadowBlur = 0;
        
        if( sectionOffset >= -windowHeight && sectionOffset <= 0 ) {
            // section entering the viewport
            translateY = (-sectionOffset)*100/windowHeight;
            
            switch(animationName) {
                case 'scaleDown':
                    scale = 1;
                    opacity = 1;
                    break;
                case 'rotate':
                    translateY = 0;
                    break;
                case 'gallery':
                    if( sectionOffset>= -windowHeight &&  sectionOffset< -0.9*windowHeight ) {
                        scale = -sectionOffset/windowHeight;
                        translateY = (-sectionOffset)*100/windowHeight;
                        boxShadowBlur = 400*(1+sectionOffset/windowHeight);
                    } else if( sectionOffset>= -0.9*windowHeight &&  sectionOffset< -0.1*windowHeight) {
                        scale = 0.9;
                        translateY = -(9/8)*(sectionOffset+0.1*windowHeight)*100/windowHeight;
                        boxShadowBlur = 40;
                    } else {
                        scale = 1 + sectionOffset/windowHeight;
                        translateY = 0;
                        boxShadowBlur = -400*sectionOffset/windowHeight;
                    }
                    break;
                case 'catch':
                    if( sectionOffset>= -windowHeight &&  sectionOffset< -0.75*windowHeight ) {
                        translateY = 100;
                        boxShadowBlur = (1 + sectionOffset/windowHeight)*160;
                    } else {
                        translateY = -(10/7.5)*sectionOffset*100/windowHeight;
                        boxShadowBlur = -160*sectionOffset/(3*windowHeight);
                    }
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = (sectionOffset + 5*windowHeight)*0.2/windowHeight;
                    opacity = (sectionOffset + windowHeight)/windowHeight;
                    break;
            }

        } else if( sectionOffset > 0 && sectionOffset <= windowHeight ) {
            //section leaving the viewport - still has the '.visible' class
            translateY = (-sectionOffset)*100/windowHeight;
            
            switch(animationName) {
                case 'scaleDown':
                    scale = (1 - ( sectionOffset * 0.3/windowHeight)).toFixed(5);
                    opacity = ( 1 - ( sectionOffset/windowHeight) ).toFixed(5);
                    translateY = 0;
                    boxShadowBlur = 40*(sectionOffset/windowHeight);

                    break;
                case 'rotate':
                    opacity = ( 1 - ( sectionOffset/windowHeight) ).toFixed(5);
                    rotateX = sectionOffset*90/windowHeight + 'deg';
                    translateY = 0;
                    break;
                case 'gallery':
                    if( sectionOffset >= 0 && sectionOffset < 0.1*windowHeight ) {
                        scale = (windowHeight - sectionOffset)/windowHeight;
                        translateY = - (sectionOffset/windowHeight)*100;
                        boxShadowBlur = 400*sectionOffset/windowHeight;
                    } else if( sectionOffset >= 0.1*windowHeight && sectionOffset < 0.9*windowHeight ) {
                        scale = 0.9;
                        translateY = -(9/8)*(sectionOffset - 0.1*windowHeight/9)*100/windowHeight;
                        boxShadowBlur = 40;
                    } else {
                        scale = sectionOffset/windowHeight;
                        translateY = -100;
                        boxShadowBlur = 400*(1-sectionOffset/windowHeight);
                    }
                    break;
                case 'catch':
                    if(sectionOffset>= 0 &&  sectionOffset< windowHeight/2) {
                        boxShadowBlur = sectionOffset*80/windowHeight;
                    } else {
                        boxShadowBlur = 80*(1 - sectionOffset/windowHeight);
                    } 
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = (sectionOffset + 5*windowHeight)*0.2/windowHeight;
                    opacity = ( windowHeight - sectionOffset )/windowHeight;
                    break;
                case 'fixed':
                    translateY = 0;
                    break;
                case 'parallax':
                    translateY = (-sectionOffset)*50/windowHeight;
                    break;

            }

        } else if( sectionOffset < -windowHeight ) {
            //section not yet visible
            translateY = 100;

            switch(animationName) {
                case 'scaleDown':
                    scale = 1;
                    opacity = 1;
                    break;
                case 'gallery':
                    scale = 1;
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = 0.8;
                    opacity = 0;
                    break;
            }

        } else {
            //section not visible anymore
            translateY = -100;

            switch(animationName) {
                case 'scaleDown':
                    scale = 0;
                    opacity = 0.7;
                    translateY = 0;
                    break;
                case 'rotate':
                    translateY = 0;
                    rotateX = '90deg';
                    break;
                case 'gallery':
                    scale = 1;
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = 1.2;
                    opacity = 0;
                    break;
                case 'fixed':
                    translateY = 0;
                    break;
                case 'parallax':
                    translateY = -50;
                    break;
            }
        }

        return [translateY, scale, rotateX, opacity, boxShadowBlur]; 
    }
});

/* Custom effects registration - feature available in the Velocity UI pack */
//none
$.Velocity.RegisterEffect("translateUp", { defaultDuration: 1, calls: [ [ { translateY: '-100%'}, 1] ] });
$.Velocity.RegisterEffect("translateDown", { defaultDuration: 1, calls: [ [ { translateY: '100%'}, 1] ] });
$.Velocity.RegisterEffect("translateNone", { defaultDuration: 1, calls: [ [ { translateY: '0', opacity: '1', scale: '1', rotateX: '0', boxShadowBlur: '0'}, 1] ] });

//scale down
$.Velocity.RegisterEffect("scaleDown", { defaultDuration: 1, calls: [ [ { opacity: '0', scale: '0.7', boxShadowBlur: '40px' }, 1] ] });

//rotation
$.Velocity.RegisterEffect("rotation", { defaultDuration: 1, calls: [ [ { opacity: '0', rotateX: '90', translateY: '-100%'}, 1] ] });
$.Velocity.RegisterEffect("rotation.scroll", { defaultDuration: 1, calls: [ [ { opacity: '0', rotateX: '90', translateY: '0'}, 1] ] });

//gallery
$.Velocity.RegisterEffect("scaleDown.moveUp", { defaultDuration: 1, calls: [ [ { translateY: '-10%', scale: '0.9', boxShadowBlur: '40px'}, 0.20 ], [ { translateY: '-100%' }, 0.60 ], [ { translateY: '-100%', scale: '1', boxShadowBlur: '0' }, 0.20 ] ] });
$.Velocity.RegisterEffect("scaleDown.moveUp.scroll", { defaultDuration: 1, calls: [ [ { translateY: '-100%', scale: '0.9', boxShadowBlur: '40px' }, 0.60 ], [ { translateY: '-100%', scale: '1', boxShadowBlur: '0' }, 0.40 ] ] });
$.Velocity.RegisterEffect("scaleUp.moveUp", { defaultDuration: 1, calls: [ [ { translateY: '90%', scale: '0.9', boxShadowBlur: '40px' }, 0.20 ], [ { translateY: '0%' }, 0.60 ], [ { translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.20 ] ] });
$.Velocity.RegisterEffect("scaleUp.moveUp.scroll", { defaultDuration: 1, calls: [ [ { translateY: '0%', scale: '0.9' , boxShadowBlur: '40px' }, 0.60 ], [ { translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.40 ] ] });
$.Velocity.RegisterEffect("scaleDown.moveDown", { defaultDuration: 1, calls: [ [ { translateY: '10%', scale: '0.9', boxShadowBlur: '40px'}, 0.20 ], [ { translateY: '100%' }, 0.60 ], [ { translateY: '100%', scale: '1', boxShadowBlur: '0'}, 0.20 ] ] });
$.Velocity.RegisterEffect("scaleDown.moveDown.scroll", { defaultDuration: 1, calls: [ [ { translateY: '100%', scale: '0.9', boxShadowBlur: '40px' }, 0.60 ], [ { translateY: '100%', scale: '1', boxShadowBlur: '0' }, 0.40 ] ] });
$.Velocity.RegisterEffect("scaleUp.moveDown", { defaultDuration: 1, calls: [ [ { translateY: '-90%', scale: '0.9', boxShadowBlur: '40px' }, 0.20 ], [ { translateY: '0%' }, 0.60 ], [ { translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.20 ] ] });

//catch up
$.Velocity.RegisterEffect("translateUp.delay", { defaultDuration: 1, calls: [ [ { translateY: '0%'}, 0.8, { delay: 100 }], ] });

//opacity
$.Velocity.RegisterEffect("hide.scaleUp", { defaultDuration: 1, calls: [ [ { opacity: '0', scale: '1.2'}, 1 ] ] });
$.Velocity.RegisterEffect("hide.scaleDown", { defaultDuration: 1, calls: [ [ { opacity: '0', scale: '0.8'}, 1 ] ] });

//parallax
$.Velocity.RegisterEffect("translateUp.half", { defaultDuration: 1, calls: [ [ { translateY: '-50%'}, 1] ] });


// =================================================
// HELPER FUNCTION: Horizontal Loop (NO TOCAR)
// =================================================
function horizontalLoop(items, config) {
  let timeline;
  items = gsap.utils.toArray(items);
  config = config || {};
  gsap.context(() => { 
    let onChange = config.onChange,
      lastIndex = 0,
      tl = gsap.timeline({repeat: config.repeat, onUpdate: onChange && function() {
          let i = tl.closestIndex();
          if (lastIndex !== i) {
            lastIndex = i;
            onChange(items[i], i);
          }
        }, paused: config.paused, defaults: {ease: "none"}, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)}),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      spaceBefore = [],
      xPercents = [],
      curIndex = 0,
      indexIsDirty = false,
      center = config.center,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1), 
      timeOffset = 0,
      container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
      totalWidth,
      getTotalWidth = () => items[length-1].offsetLeft + xPercents[length-1] / 100 * widths[length-1] - startX + spaceBefore[0] + items[length-1].offsetWidth * gsap.getProperty(items[length-1], "scaleX") + (parseFloat(config.paddingRight) || 0),
      populateWidths = () => {
        let b1 = container.getBoundingClientRect(), b2;
        items.forEach((el, i) => {
          widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
          xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / widths[i] * 100 + gsap.getProperty(el, "xPercent"));
          b2 = el.getBoundingClientRect();
          spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
          b1 = b2;
        });
        gsap.set(items, { 
          xPercent: i => xPercents[i]
        });
        totalWidth = getTotalWidth();
      },
      timeWrap,
      populateOffsets = () => {
        timeOffset = center ? tl.duration() * (container.offsetWidth / 2) / totalWidth : 0;
        center && times.forEach((t, i) => {
          times[i] = timeWrap(tl.labels["label" + i] + tl.duration() * widths[i] / 2 / totalWidth - timeOffset);
        });
      },
      getClosest = (values, value, wrap) => {
        let i = values.length,
          closest = 1e10,
          index = 0, d;
        while (i--) {
          d = Math.abs(values[i] - value);
          if (d > wrap / 2) {
            d = wrap - d;
          }
          if (d < closest) {
            closest = d;
            index = i;
          }
        }
        return index;
      },
      populateTimeline = () => {
        let i, item, curX, distanceToStart, distanceToLoop;
        tl.clear();
        for (i = 0; i < length; i++) {
          item = items[i];
          curX = xPercents[i] / 100 * widths[i];
          distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
          distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
          tl.to(item, {xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond}, 0)
            .fromTo(item, {xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100)}, {xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false}, distanceToLoop / pixelsPerSecond)
            .add("label" + i, distanceToStart / pixelsPerSecond);
          times[i] = distanceToStart / pixelsPerSecond;
        }
        timeWrap = gsap.utils.wrap(0, tl.duration());
      },
      refresh = (deep) => {
        let progress = tl.progress();
        tl.progress(0, true);
        populateWidths();
        deep && populateTimeline();
        populateOffsets();
        deep && tl.draggable && tl.paused() ? tl.time(times[curIndex], true) : tl.progress(progress, true);
      },
      onResize = () => refresh(true),
      proxy;
    gsap.set(items, {x: 0});
    populateWidths();
    populateTimeline();
    populateOffsets();
    window.addEventListener("resize", onResize);
    function toIndex(index, vars) {
      vars = vars || {};
      (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length); // always go in the shortest direction
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
      if (time > tl.time() !== index > curIndex && index !== curIndex) { // if we're wrapping the timeline's playhead, make the proper adjustments
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      if (time < 0 || time > tl.duration()) {
        vars.modifiers = {time: timeWrap};
      }
      curIndex = newIndex;
      vars.overwrite = true;
      gsap.killTweensOf(proxy);    
      return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
    }
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.closestIndex = setCurrent => {
      let index = getClosest(times, tl.time(), tl.duration());
      if (setCurrent) {
        curIndex = index;
        indexIsDirty = false;
      }
      return index;
    };
    tl.current = () => indexIsDirty ? tl.closestIndex(true) : curIndex;
    tl.next = vars => toIndex(tl.current()+1, vars);
    tl.previous = vars => toIndex(tl.current()-1, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true); // pre-render for performance
    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }
    if (config.draggable && typeof(Draggable) === "function") {
      proxy = document.createElement("div")
      let wrap = gsap.utils.wrap(0, 1),
        ratio, startProgress, draggable, dragSnap, lastSnap, initChangeX, wasPlaying,
        align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
        syncIndex = () => tl.closestIndex(true);
      typeof(InertiaPlugin) === "undefined" && console.warn("InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club");
      draggable = Draggable.create(proxy, {
        trigger: items[0].parentNode,
        type: "x",
        onPressInit() {
          let x = this.x;
          gsap.killTweensOf(tl);
          wasPlaying = !tl.paused();
          tl.pause();
          startProgress = tl.progress();
          refresh();
          ratio = 1 / totalWidth;
          initChangeX = (startProgress / -ratio) - x;
          gsap.set(proxy, {x: startProgress / -ratio});
        },
        onDrag: align,
        onThrowUpdate: align,
        overshootTolerance: 0,
        inertia: true,
        snap(value) {
          //note: if the user presses and releases in the middle of a throw, due to the sudden correction of proxy.x in the onPressInit(), the velocity could be very large, throwing off the snap. So sense that condition and adjust for it. We also need to set overshootTolerance to 0 to prevent the inertia from causing it to shoot past and come back
          if (Math.abs(startProgress / -ratio - this.x) < 10) {
            return lastSnap + initChangeX
          }
          let time = -(value * ratio) * tl.duration(),
            wrappedTime = timeWrap(time),
            snapTime = times[getClosest(times, wrappedTime, tl.duration())],
            dif = snapTime - wrappedTime;
          Math.abs(dif) > tl.duration() / 2 && (dif += dif < 0 ? tl.duration() : -tl.duration());
          lastSnap = (time + dif) / tl.duration() / -ratio;
          return lastSnap;
        },
        onRelease() {
          syncIndex();
          draggable.isThrowing && (indexIsDirty = true);
        },
        onThrowComplete: () => {
          syncIndex();
          wasPlaying && tl.play();
        }
      })[0];
      tl.draggable = draggable;
    }
    tl.closestIndex(true);
    lastIndex = curIndex;
    onChange && onChange(items[curIndex], curIndex);
    timeline = tl;
    return () => window.removeEventListener("resize", onResize); // cleanup
  });
  return timeline;
}

// =================================================
// INITIALIZATION (DOM READY)
// =================================================

document.addEventListener("DOMContentLoaded", function() {
    // 1. Registramos los plugins
    gsap.registerPlugin(SplitText, Draggable, InertiaPlugin);

    // -----------------------------------------------------
    // A. ANIMACIONES DE TEXTO (TU NUEVO CÓDIGO REEMPLAZADO)
    // -----------------------------------------------------

    // --- 1. Texto Reveal (Caracteres) ---
    let observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let elemento = entry.target;
                elemento.style.opacity = 1; // asegurar visible
                
                let split = new SplitText(elemento, { type: "chars" });
                gsap.from(split.chars, {
                    opacity: 0,
                    yPercent: 100,
                    stagger: 0.05,
                    duration: 0.8,
                    ease: "power3.out",
                    overwrite: true
                });
                observer.unobserve(elemento);
            }
        });
    }, { threshold: 0.5 });

    let textos = document.querySelectorAll(".texto-reveal");
    textos.forEach(texto => {
        observer.observe(texto);
    });

    // --- 2. Texto Mask (Estilo deiv.dev) ---
    const textosMask = document.querySelectorAll(".texto-mask");

    if (textosMask.length > 0) {
        textosMask.forEach(texto => {
            // Aseguramos que sea visible antes de dividir
            texto.style.opacity = 1;

            // Primera división: Crea los renglones contenedores (la máscara)
            const splitOuter = new SplitText(texto, { 
                type: "lines",
                linesClass: "texto-mask-line" 
            });

            // Segunda división: Envuelve el texto dentro de la máscara
            const splitInner = new SplitText(splitOuter.lines, {
                type: "lines",
                linesClass: "texto-mask-inner" 
            });

            // El Vigilante (Intersection Observer)
            const observerMask = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        
                        // Animamos solo la parte interna hacia arriba
                        gsap.from(splitInner.lines, {
                            yPercent: 100,      // Sube desde el 100% abajo
                            duration: 1.2,
                            ease: "power4.out", // Movimiento muy elegante
                            stagger: 0.1,       // Tiempo entre líneas
                            overwrite: true
                        });

                        observerMask.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });

            observerMask.observe(texto);
        });
    }

    // -----------------------------------------------------
    // B. NAVEGACIÓN DE SECCIONES (Botones Next/Prev)
    // -----------------------------------------------------
    const sections = Array.from(document.querySelectorAll('.cd-section'));
    if (sections.length > 0) {
        let activeSection = 0;
        const btnPrev = document.querySelector('.cd-prev');
        const btnNext = document.querySelector('.cd-next');

        function updateNavButtons() {
            if (!btnPrev || !btnNext) return;
            btnPrev.classList.toggle('inactive', activeSection === 0);
            btnNext.classList.toggle('inactive', activeSection === sections.length - 1);
        }
        updateNavButtons();

        function goToSection(index) {
            if (index < 0 || index >= sections.length) return;
            activeSection = index;
            sections[index].scrollIntoView({ behavior: 'smooth' });
            updateNavButtons();
        }

        if (btnPrev) btnPrev.addEventListener('click', () => goToSection(activeSection - 1));
        if (btnNext) btnNext.addEventListener('click', () => goToSection(activeSection + 1));

        window.addEventListener('scroll', () => {
            const screenMid = window.innerHeight / 2;
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                if (rect.top <= screenMid && rect.bottom > screenMid) {
                    activeSection = index;
                    updateNavButtons();
                }
            });
        });
    }

    // -----------------------------------------------------
    // C. CARROUSEL DE CARDS (INTACTO)
    // -----------------------------------------------------
    const wrapper = document.querySelector(".wrapper");
    
    // Solo ejecutamos si el carrusel existe en la página
    if (wrapper) {
        const boxes = gsap.utils.toArray(".box");
        let activeElement;
        
        const loop = horizontalLoop(boxes, {
            paused: true, 
            draggable: true, 
            center: true, 
            onChange: (element, index) => { 
                activeElement && activeElement.classList.remove("active");
                element.classList.add("active");
                activeElement = element;
            }
        });

        boxes.forEach((box, i) => box.addEventListener("click", () => loop.toIndex(i, {duration: 0.8, ease: "power1.inOut"})));

        const btnToggle = document.querySelector(".toggle");
        const btnNext = document.querySelector(".next");
        const btnPrev = document.querySelector(".prev");

        if(btnToggle) btnToggle.addEventListener("click", () => wrapper.classList.toggle("show-overflow"));
        if(btnNext) btnNext.addEventListener("click", () => loop.next({duration: 0.4, ease: "power1.inOut"}));
        if(btnPrev) btnPrev.addEventListener("click", () => loop.previous({duration: 0.4, ease: "power1.inOut"}));
    }
});



