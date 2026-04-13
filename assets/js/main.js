jQuery(document).ready(function($){
  
    //variables
    var hijacking= $('body').data('hijacking'),
        animationType = $('body').data('animation'),
        delta = 0,
        scrollThreshold = 0,
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

                // --- DESKTOP: Lógica para navegar con el menú ---
                $('.nav-link').on('click', function(event){
                    event.preventDefault();
                    var targetId = $(this).attr('href'); 
                    var target = $(targetId);

                    if(target.length && !target.hasClass('visible') && !animating) {
                        animating = true;
                        var current = sectionsAvailable.filter('.visible');
                        
                        var currentIndex = sectionsAvailable.index(current);
                        var targetIndex = sectionsAvailable.index(target);
                        var direction = (targetIndex > currentIndex) ? 'next' : 'prev';

                        var animationParams = selectAnimation(animationType, false, direction);
                        var exitAnimation = (direction == 'next') ? animationParams[1] : animationParams[2];

                        if (direction == 'next') {
                            target.prevAll('.cd-section').children('div').velocity(animationParams[1], 0);
                        } else {
                            target.nextAll('.cd-section').children('div').velocity(animationParams[2], 0);
                        }

                        current.removeClass('visible').children('div').velocity(exitAnimation, animationParams[3], animationParams[4]);

                        target.addClass('visible').children('div').velocity(animationParams[0], animationParams[3], animationParams[4], function(){
                            animating = false;
                            resetScroll();
                        });
                        
                        actual = targetIndex + 1;
                    }
                });
                // --- FIN DESKTOP ---

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
            checkNavigation();

        } else if( MQ == 'mobile' ) {
            // --- MOBILE: Lógica corregida ---
            
            // 1. Limpieza de efectos de escritorio
            resetSectionStyle();
            $(window).off('DOMMouseScroll mousewheel', scrollHijacking);
            $(window).off('scroll', scrollAnimation);
            prevArrow.off('click', prevSection);
            nextArrow.off('click', nextSection);
            $(document).off('keydown');

            // 2. Activamos los clicks en el menú para celular (LINKS NORMALES)
            $('.nav-link').off('click').on('click', function(event){
                event.preventDefault(); 
                
                // Cerrar el menú hamburguesa de Bootstrap
                $('.navbar-collapse').collapse('hide'); 

                // Buscar la sección destino
                var targetId = $(this).attr('href');
                var target = $(targetId);

                if( target.length ) {
                    // Calculamos un pequeño espacio para el header fijo (aprox 70px)
                    var headerHeight = 70; 
                    
                    // Animación suave nativa (sin hijacking)
                    $('html, body').stop().animate({
                        scrollTop: target.offset().top - headerHeight
                    }, 300); 
                }
            });

            // 3. LÓGICA HOME BUTTON (NUEVO: Ir arriba de todo)
            $('.cd-home').off('click').on('click', function(event){
                event.preventDefault();
                $('html, body').stop().animate({
                    scrollTop: 0
                }, 300);
            });

            // --- FIN MOBILE ---
        }
    }

    function scrollAnimation(){
        (!window.requestAnimationFrame) ? animateSection() : window.requestAnimationFrame(animateSection);
    }

    function animateSection() {
        var scrollTop = $(window).scrollTop(),
            windowHeight = $(window).height(),
            windowWidth = $(window).width();
        
        sectionsAvailable.each(function(){
            var actualBlock = $(this),
                offset = scrollTop - actualBlock.offset().top;

            var animationValues = setSectionAnimation(offset, windowHeight, animationType);
            
            transformSection(actualBlock.children('div'), animationValues[0], animationValues[1], animationValues[2], animationValues[3], animationValues[4]);
            ( offset >= 0 && offset < windowHeight ) ? actualBlock.addClass('visible') : actualBlock.removeClass('visible');        
        });
        
        checkNavigation();
    }

    function transformSection(element, translateY, scaleValue, rotateXValue, opacityValue, boxShadow) {
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
        // NUEVO: Si hay un modal abierto, cancelamos el scroll de las secciones
        if ($('body').hasClass('modal-open')) return false;

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
        ( sectionsAvailable.filter('.visible').is(':first-of-type') ) ? prevArrow.addClass('inactive') : prevArrow.removeClass('inactive');
        ( sectionsAvailable.filter('.visible').is(':last-of-type')  ) ? nextArrow.addClass('inactive') : nextArrow.removeClass('inactive');
    }

    function resetSectionStyle() {
        sectionsAvailable.children('div').each(function(){
            $(this).attr('style', '');
        });
    }

    function deviceType() {
        // DETECCIÓN SEGURA: Si mide menos de 1024px es mobile
        if (window.innerWidth < 1024) {
            return 'mobile';
        }
        return 'desktop';
    }

    function selectAnimation(animationName, middleScroll, direction) {
        var animationVisible = 'translateNone',
            animationTop = 'translateUp',
            animationBottom = 'translateDown',
            easing = 'ease',
            animDuration = 500; // Velocidad Desktop (ajustada a 500ms)

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
        var scale = 1,
            translateY = 100,
            rotateX = '0deg',
            opacity = 1,
            boxShadowBlur = 0;
        
        if( sectionOffset >= -windowHeight && sectionOffset <= 0 ) {
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
$.Velocity.RegisterEffect("translateUp", { defaultDuration: 1, calls: [ [ { translateY: '-100%'}, 1] ] });
$.Velocity.RegisterEffect("translateDown", { defaultDuration: 1, calls: [ [ { translateY: '100%'}, 1] ] });
$.Velocity.RegisterEffect("translateNone", { defaultDuration: 1, calls: [ [ { translateY: '0', opacity: '1', scale: '1', rotateX: '0', boxShadowBlur: '0'}, 1] ] });
$.Velocity.RegisterEffect("scaleDown", { defaultDuration: 1, calls: [ [ { opacity: '0', scale: '0.7', boxShadowBlur: '40px' }, 1] ] });
$.Velocity.RegisterEffect("rotation", { defaultDuration: 1, calls: [ [ { opacity: '0', rotateX: '90', translateY: '-100%'}, 1] ] });
$.Velocity.RegisterEffect("rotation.scroll", { defaultDuration: 1, calls: [ [ { opacity: '0', rotateX: '90', translateY: '0'}, 1] ] });
$.Velocity.RegisterEffect("scaleDown.moveUp", { defaultDuration: 1, calls: [ [ { translateY: '-10%', scale: '0.9', boxShadowBlur: '40px'}, 0.20 ], [ { translateY: '-100%' }, 0.60 ], [ { translateY: '-100%', scale: '1', boxShadowBlur: '0' }, 0.20 ] ] });
$.Velocity.RegisterEffect("scaleDown.moveUp.scroll", { defaultDuration: 1, calls: [ [ { translateY: '-100%', scale: '0.9', boxShadowBlur: '40px' }, 0.60 ], [ { translateY: '-100%', scale: '1', boxShadowBlur: '0' }, 0.40 ] ] });
$.Velocity.RegisterEffect("scaleUp.moveUp", { defaultDuration: 1, calls: [ [ { translateY: '90%', scale: '0.9', boxShadowBlur: '40px' }, 0.20 ], [ { translateY: '0%' }, 0.60 ], [ { translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.20 ] ] });
$.Velocity.RegisterEffect("scaleUp.moveUp.scroll", { defaultDuration: 1, calls: [ [ { translateY: '0%', scale: '0.9' , boxShadowBlur: '40px' }, 0.60 ], [ { translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.40 ] ] });
$.Velocity.RegisterEffect("scaleDown.moveDown", { defaultDuration: 1, calls: [ [ { translateY: '10%', scale: '0.9', boxShadowBlur: '40px'}, 0.20 ], [ { translateY: '100%' }, 0.60 ], [ { translateY: '100%', scale: '1', boxShadowBlur: '0'}, 0.20 ] ] });
$.Velocity.RegisterEffect("scaleDown.moveDown.scroll", { defaultDuration: 1, calls: [ [ { translateY: '100%', scale: '0.9', boxShadowBlur: '40px' }, 0.60 ], [ { translateY: '100%', scale: '1', boxShadowBlur: '0' }, 0.40 ] ] });
$.Velocity.RegisterEffect("scaleUp.moveDown", { defaultDuration: 1, calls: [ [ { translateY: '-90%', scale: '0.9', boxShadowBlur: '40px' }, 0.20 ], [ { translateY: '0%' }, 0.60 ], [ { translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.20 ] ] });
$.Velocity.RegisterEffect("translateUp.delay", { defaultDuration: 1, calls: [ [ { translateY: '0%'}, 0.8, { delay: 100 }], ] });
$.Velocity.RegisterEffect("hide.scaleUp", { defaultDuration: 1, calls: [ [ { opacity: '0', scale: '1.2'}, 1 ] ] });
$.Velocity.RegisterEffect("hide.scaleDown", { defaultDuration: 1, calls: [ [ { opacity: '0', scale: '0.8'}, 1 ] ] });
$.Velocity.RegisterEffect("translateUp.half", { defaultDuration: 1, calls: [ [ { translateY: '-50%'}, 1] ] });


// =================================================
// HELPER FUNCTION: Horizontal Loop
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
        tl.progress(progress, true);
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
    gsap.registerPlugin(SplitText, Draggable, InertiaPlugin);

    // --- 1. Texto Reveal (Caracteres - Títulos) ---
    let observerReveal = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            let elemento = entry.target;
            if (!elemento.splitInstance) {
                elemento.splitInstance = new SplitText(elemento, { type: "chars" });
            }
            let chars = elemento.splitInstance.chars;

            if (entry.isIntersecting) {
                elemento.style.opacity = 1;
                gsap.fromTo(chars, 
                    { opacity: 0, yPercent: 100 }, 
                    { opacity: 1, yPercent: 0, stagger: 0.03, duration: 0.8, ease: "power3.out", overwrite: true }
                );
            } else {
                gsap.set(chars, { opacity: 0, yPercent: 100 });
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(".texto-reveal").forEach(texto => {
        observerReveal.observe(texto);
    });

    // --- 2. Texto Mask (Párrafos) ---
    const textosMask = document.querySelectorAll(".texto-mask");
    if (textosMask.length > 0) {
        textosMask.forEach(texto => {
            texto.style.opacity = 1;
            const splitOuter = new SplitText(texto, { type: "lines", linesClass: "texto-mask-line" });
            const splitInner = new SplitText(splitOuter.lines, { type: "lines", linesClass: "texto-mask-inner" });

            const observerMask = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        gsap.fromTo(splitInner.lines, 
                            { yPercent: 100 }, 
                            { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.1, overwrite: true }
                        );
                    } else {
                        gsap.set(splitInner.lines, { yPercent: 100 });
                    }
                });
            }, { threshold: 0.15 });
            observerMask.observe(texto);
        });
    }

    // --- 3. Carrousel de Cards ---
    const wrapper = document.querySelector(".wrapper");
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

    // --- 4. Skills Marquee ---
    window.addEventListener("load", () => {
        const skillItems = document.querySelectorAll(".skill-item");
        if (skillItems.length > 0) {
            const skillsLoop = horizontalLoop(skillItems, {
                repeat: -1, 
                speed: 1,      
                paused: false, 
                paddingRight: 80 
            });
        }
    });
});



const proyectosData = {
    'menu': {
        titleMain: "Menú a medida",
        subtitle: "E-commerce",
descripcion: "<p><strong>Menú a tu medida</strong> es una aplicación web pensada para resolver el estrés de la planificación de comidas semanales. La plataforma permite a los usuarios personalizar sus dietas eligiendo planes que se adaptan a sus rutinas y gustos, ofreciendo desde viandas principales hasta desayunos y meriendas.</p><p><strong>Diseño UX/UI:</strong> <br> El desafío principal fue crear un flujo intuitivo para recolectar las preferencias del usuario sin generar fricción. Me apoyé en la empatía para diseñar en Figma una interfaz limpia, accesible y visualmente apetitosa, donde la jerarquía visual guía la navegación de forma natural.</p><p><strong>Desarrollo Frontend:</strong> <br> Mi foco estuvo en ser el puente entre la creatividad y la lógica. Utilicé HTML5 para la estructura semántica y SASS para mantener estilos modulares y lograr un diseño responsive. La interactividad la trabajé con JavaScript, asegurando que la experiencia final fuera 100% fiel al prototipo.</p>",
        tags: ["HTML5", "CSS3", "JavaScript", "SASS"],
        gallery: [ 
            "./assets/img/proyectos/galeria/matm-web1.png", 
            "./assets/img/proyectos/galeria/matm-web2.png", 
            "./assets/img/proyectos/galeria/matm-web3.png", 
            "./assets/img/proyectos/galeria/matm-web4.png", 
            "./assets/img/proyectos/galeria/matm-web5.png", 
            "./assets/img/proyectos/galeria/matm-mobile1.png", 
            "./assets/img/proyectos/galeria/matm-mobile2.png", 
            "./assets/img/proyectos/galeria/matm-mobile3.png",
            "./assets/img/proyectos/galeria/matm-mobile4.png"
        ],
        links: [
            { label: "Ver código", url: "https://github.com/julianarocha-web/shop.menuatumedida", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' },
            { label: "Ver diseño", url: "https://www.figma.com/design/E18z6oe4RBHzbWjCBoCWkk/Prototipado-Men%C3%BA-E-Commerce?node-id=0-1&t=ZcCmgqZ5VGJ1GOpF-1", icon: '<img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma">' },
            { label: "Ver demo", url: "https://julianarocha-web.github.io/shop.menuatumedida/", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' }
        ]
    },
        'goJapon': {
        titleMain: "Go Japón",
        subtitle: "Guía de tu viaje",
        descripcion: `
        <p><strong>Go Japón</strong> es una plataforma informativa diseñada para viajeros que buscan una experiencia auténtica y organizada en el país nipón. El objetivo principal fue jerarquizar una gran cantidad de información práctica (transporte, gastronomía y destinos) en una interfaz limpia y visualmente atractiva.</p>
        <p><strong>Diseño y Desarrollo:</strong> Se aplicó una estética minimalista inspirada en el diseño japonés, utilizando <strong>Bootstrap</strong> para una estructura de rejilla (grid) robusta y <strong>SASS</strong> para gestionar una paleta de colores coherente y componentes reutilizables. La arquitectura permite una navegación fluida entre guías de transporte y experiencias culturales.</p>
        <p><strong>Aprendizajes clave:</strong> Reforcé el uso de utilidades avanzadas de Bootstrap y la modularización de estilos con SASS para mantener un código escalable y fácil de mantener.</p>
    `,
        tags: ["HTML5", "CSS3", "BootStrap", "SASS"],
        gallery: [ 
            "./assets/img/proyectos/galeria-japon/web-japon1.png", 
            "./assets/img/proyectos/galeria-japon/web-japon2.png", 
            "./assets/img/proyectos/galeria-japon/web-japon3.png", 
            "./assets/img/proyectos/galeria-japon/web-japon4.png", 
            "./assets/img/proyectos/galeria-japon/web-japon5.png",
            "./assets/img/proyectos/galeria-japon/web-japon6.png"            
        ],
        links: [
            { label: "Ver código", url: "https://github.com/julianarocha-web/gojapon-2", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' },
            { label: "Ver diseño", url: "https://www.figma.com/design/rpLtJ3ukYLhUrpjJ9cYjMU/Portfolio?node-id=341-511&t=RoDFMHOhre67bZJh-1", icon: '<img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma">' },
            { label: "Ver demo", url: "https://julianarocha-web.github.io/gojapon-2/", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' }
        ]
    },
            'menuLanding': {
        titleMain: "Menú a medida",
        subtitle: "Landing Page",
descripcion: `
        <p><strong>Menú a tu medida</strong> fue mi primer desafío de maquetación real. El objetivo fue crear una landing page atractiva y funcional para un servicio de viandas personalizadas, enfocada en resolver la organización alimentaria diaria de los usuarios.</p>
        <p><strong>Diseño y Maquetación:</strong> Al ser mi proyecto inicial, me enfocqué en dominar la estructura semántica de <strong>HTML5</strong> y la potencia de <strong>CSS3</strong> para el diseño visual. Implementé un sistema de tarjetas para los planes y secciones de muestra de platos con composiciones asimétricas que dinamizan la lectura.</p>
        <p><strong>Aprendizajes clave:</strong> Este proyecto fue fundamental para comprender el flujo de diseño (Mobile First), el uso de Flexbox para alineaciones complejas y la importancia de la UX en formularios de suscripción y secciones de FAQ.</p>
    `,
        tags: ["HTML5", "CSS3", "BootStrap", "SASS"],
        gallery: [ 
            "./assets/img/proyectos/galeria-menulanding/menulanding-1.png", 
            "./assets/img/proyectos/galeria-menulanding/menulanding-2.png",  
            "./assets/img/proyectos/galeria-menulanding/menulanding-3.png",  
            "./assets/img/proyectos/galeria-menulanding/menulanding-4.png",  
            "./assets/img/proyectos/galeria-menulanding/menulanding-5.png", 
            "./assets/img/proyectos/galeria-menulanding/menulanding-6.png"            
        ],
        links: [
            { label: "Ver código", url: "https://github.com/julianarocha-web/menuatumedida", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' },
            { label: "Ver diseño", url: "https://www.figma.com/design/rpLtJ3ukYLhUrpjJ9cYjMU/Portfolio?node-id=341-511&t=RoDFMHOhre67bZJh-1", icon: '<img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma">' },
            { label: "Ver demo", url: "https://julianarocha-web.github.io/menuatumedida/", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' }
        ]
    },
                'piezasGraficas': {
        titleMain: "Redes sociales",
        subtitle: "Comunicación visual",
descripcion: `
        <p>En este proyecto exploro la intersección entre el <strong>diseño gráfico publicitario</strong> y el <strong>marketing digital</strong>. El objetivo fue crear una identidad visual sólida y atractiva para redes sociales, capaz de captar la atención del usuario en segundos.</p>
        <p><strong>Estrategia Visual:</strong> Utilicé <strong>Adobe Illustrator</strong> para la creación de piezas vectoriales de alta precisión y <strong>Figma</strong> para el prototipado de layouts dinámicos. Me enfocqué en la composición, el manejo de la teoría del color y la tipografía para transmitir los valores de la marca de forma clara y profesional.</p>
        <p><strong>Marketing Digital:</strong> Cada pieza fue diseñada bajo criterios de conversión, optimizando el espacio para llamadas a la acción (CTA) y adaptando los formatos para maximizar el engagement en plataformas como Instagram y Facebook.</p>
    `,
        tags: ["Figma", "Adobe Illustrator"],
        gallery: [ 
            "./assets/img/proyectos/galeria-piezas/franui-jpg.jpg", 
            "./assets/img/proyectos/galeria-piezas/avocado.jpg",  
            "./assets/img/proyectos/galeria-piezas/burgas.jpg",  
            "./assets/img/proyectos/galeria-piezas/cookies.jpg",  
            "./assets/img/proyectos/galeria-piezas/panaderia.jpg", 
            "./assets/img/proyectos/galeria-piezas/pasos.jpg", 
            "./assets/img/proyectos/galeria-piezas/sandwich.jpg", 
            "./assets/img/proyectos/galeria-piezas/chowfan.jpg",  
            "./assets/img/proyectos/galeria-piezas/chipa.jpg",        
        ],
        links: [
            { label: "Ver diseño", url: "https://www.figma.com/design/VFpH0ptcTAkCFlK4tDum7F/Comunicaci%C3%B3n-Visual?node-id=168-64&t=E89nwHKTR51cQXDG-1", icon: '<img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma">' },
        ]
    },
    'moodiemap': { // Por ejemplo, para tu app Moodie Map
    titleMain: "Moodie Map",
    subtitle: "UX Research & App",
    descripcion: `
    <p><strong>Moodie Map</strong> es una aplicación de bienestar personal diseñada para el seguimiento emocional diario. Actualmente, el desarrollo de la aplicación se encuentra <strong>en proceso</strong>, enfocándose en convertir una idea conceptual en una herramienta funcional y empática.</p>
    <p><strong>Proceso de Diseño:</strong> Inicié este proyecto a principios de 2025, comenzando desde cero con la creación de wireframes de baja fidelidad para definir la arquitectura de la información. A través de un proceso iterativo, evolucioné estos esquemas básicos hasta alcanzar el <strong>prototipo de alta fidelidad</strong> que se muestra en el video, priorizando una navegación fluida y una estética relajante.</p>
    <p><strong>Prototipado en Figma:</strong> Utilicé Figma para dar vida a la interacción, implementando componentes dinámicos y transiciones avanzadas que permiten visualizar la experiencia real del usuario. Mi objetivo fue garantizar que el registro de estados de ánimo fuera una tarea intuitiva, eliminando cualquier tipo de fricción cognitiva en el flujo de la app.</p>
`,
    tags: ["UX Research", "Figma", "Mobile Design"],
    gallery: [], // Puedes dejarla vacía si solo quieres video
    video: "./assets/img/proyectos/galeria-moodiemap/moodiemap.mp4", // Path a tu video
            links: [
            { label: "Ver prototipo", url: "https://www.figma.com/proto/jnUVU1ZnLWHFOkFEITqUq8/Manual-de-Marca?node-id=234-512&p=f&t=6xi6vTDCzgLBcJKb-1&scaling=min-zoom&content-scaling=fixed&page-id=234%3A511&starting-point-node-id=725%3A1127&show-proto-sidebar=1", icon: '<img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma">' },
        ]
},
        'cherryDew': { 
    titleMain: "Cherry Dew",
    subtitle: "E-Commerce",
    descripcion: `
        <p><strong>Cherry Dew</strong> es un proyecto de e-commerce integral diseñado para una marca de cosmética y decoración. El objetivo principal fue transformar una identidad visual minimalista en una plataforma de ventas funcional, estética y optimizada para el mercado digital actual.</p>
        
        <p><strong>Desarrollo y Personalización:</strong> La plataforma fue construida utilizando <strong>WordPress</strong> como base de gestión, sobre la cual integré <strong>código propio</strong> para personalizar la experiencia de usuario y romper con las limitaciones de las plantillas estándar. Me enfocqué en crear un flujo de compra limpio y directo, asegurando que cada producto destaque visualmente.</p>
        
        <p><strong>SEO y Rendimiento:</strong> Más allá del diseño, trabajé profundamente en el <strong>posicionamiento SEO</strong>. Implementé una arquitectura de información estratégica, optimización de metadatos y una estructura técnica orientada a mejorar la visibilidad en motores de búsqueda, garantizando al mismo tiempo tiempos de carga rápidos para reducir la tasa de rebote.</p>
    `,
    tags: ["E-commerce", "WordPress", "SEO Optimization"],
    gallery: [
            "./assets/img/proyectos/cherry-dew/galeria/pc1.png", 
            "./assets/img/proyectos/cherry-dew/galeria/pc2.png",  
            "./assets/img/proyectos/cherry-dew/galeria/pc3.png",  
            "./assets/img/proyectos/cherry-dew/galeria/pc4.png",  
            "./assets/img/proyectos/cherry-dew/galeria/pc5.png", 
            "./assets/img/proyectos/cherry-dew/galeria/pc6.png", 
            "./assets/img/proyectos/cherry-dew/galeria/mobile1.png", 
            "./assets/img/proyectos/cherry-dew/galeria/mobile2.png",  
            "./assets/img/proyectos/cherry-dew/galeria/mobile3.png",
            "./assets/img/proyectos/cherry-dew/galeria/mobile4.png",
        ],
        links: [
            { label: "Ver código", url: "https://github.com/julianarocha-web/menuatumedida", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' },
                        { label: "Ver diseño", url: "https://www.figma.com", icon: '<img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma">' },
            { label: "Ver demo", url: "https://dev-cherrydew.pantheonsite.io/", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' }
        ]
},
};

document.addEventListener("DOMContentLoaded", function() {
    const modalElement = document.getElementById('proyectoModal');
    if (!modalElement) return;
    const proyectoModal = new bootstrap.Modal(modalElement);

    const boxes = document.querySelectorAll('.carrousel .item.box');
    let startX, startY;

    boxes.forEach(box => {
        box.addEventListener('pointerdown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
        });

        box.addEventListener('pointerup', (e) => {
            let diffX = Math.abs(e.clientX - startX);
            let diffY = Math.abs(e.clientY - startY);

            // Si es un clic real y no un drag
            if (diffX < 5 && diffY < 5) {
                const idProyecto = box.getAttribute('data-proyecto');
                const data = proyectosData[idProyecto];

                if (data) {
                    // Limpiar clases previas para evitar conflictos
                    modalElement.classList.remove('modal-especial-grafico');

                    document.getElementById('modal-title-main').innerText = data.titleMain;
                    document.getElementById('modal-subtitle').innerText = data.subtitle;
                    document.getElementById('modal-descripcion').innerHTML = data.descripcion;

                    // Llenar tags
                    const tagsContainer = document.getElementById('modal-tags');
                    tagsContainer.innerHTML = '';
                    data.tags.forEach(tag => {
                        tagsContainer.innerHTML += `<span>${tag}</span>`;
                    });

                    // Llenar galería o Video
                    const galleryContainer = document.getElementById('modal-gallery');
                    galleryContainer.innerHTML = '';

                    const btnNext = document.getElementById('modal-btn-next');
                    const btnPrev = document.getElementById('modal-btn-prev');

                    if (data.video) {
                        // Limpiamos estilos de la galería para el video
                        galleryContainer.style.height = '350px';
                        galleryContainer.style.overflow = 'hidden';

                        galleryContainer.innerHTML = `
                            <div class="video-container" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                                <video controls autoplay muted loop class="rounded-4 shadow" style="max-height: 100%; width: auto; object-fit: contain;">
                                    <source src="${data.video}" type="video/mp4">
                                    Tu navegador no soporta videos.
                                </video>
                            </div>
                        `;
                        
                        if(btnNext) btnNext.style.display = 'none';
                        if(btnPrev) btnPrev.style.display = 'none';
                    } else {
                        // Si no hay video, cargamos la galería como antes
                        if(btnNext) btnNext.style.display = 'flex';
                        if(btnPrev) btnPrev.style.display = 'flex';
                        
                        data.gallery.forEach(imgSrc => {
                            const esMobile = imgSrc.includes('mobile') ? 'modal-img-mobile' : 'modal-img-desktop';
                            galleryContainer.innerHTML += `<img src="${imgSrc}" class="${esMobile}" alt="Proyecto" draggable="false" style="user-select: none; -webkit-user-drag: none;">`;
                        });
                    }

                    // --- Llenar botones y ajustar Galería (LÓGICA ESPECIAL PARA PIEZAS GRÁFICAS) ---
                    const linksContainer = document.getElementById('modal-links');
                    linksContainer.innerHTML = '';

                    if (idProyecto === 'piezasGraficas' || idProyecto === 'moodiemap') {
                        // Añadir la clase especial al modal
                        modalElement.classList.add('modal-especial-grafico');
                        // Forzar flex-start para que el scroll horizontal funcione correctamente
                        galleryContainer.style.justifyContent = 'center';
                        linksContainer.classList.add('justify-content-center');
                        linksContainer.classList.remove('justify-content-end');
                    } else {
                        // Para el resto de los proyectos, restauramos comportamiento normal
                        galleryContainer.style.justifyContent = 'flex-start';
                        linksContainer.classList.remove('justify-content-center');
                        linksContainer.classList.add('justify-content-end');
                    }

                    data.links.forEach(link => {
                        if (link.url && link.url !== "") {
                            linksContainer.innerHTML += `
                                <a href="${link.url}" target="_blank" class="action-btn">
                                    ${link.icon} ${link.label} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                                </a>
                            `;
                        }
                    });

                    proyectoModal.show();
                }
            }
        });
    });
});

// Lógica para botones de la galería del modal
$(document).on('click', '#modal-btn-next', function() {
    const container = document.getElementById('modal-gallery');
    if (container) {
        // Empujamos 450px fijos. Si hay más fotos, se moverá sin importar cálculos.
        container.scrollBy({ left: 450, behavior: 'smooth' });
    }
});

$(document).on('click', '#modal-btn-prev', function() {
    const container = document.getElementById('modal-gallery');
    if (container) {
        container.scrollBy({ left: -450, behavior: 'smooth' });
    }
});




