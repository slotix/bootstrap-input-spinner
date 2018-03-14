/**
 * Author: shaack
 * Date: 14.03.2018
 */

(function ($) {
    "use strict";
    $.fn.InputSpinner = function (options) {

        const config = {
            decrementHtml: "<strong>-</strong>", // button text
            incrementHtml: "<strong>+</strong>", // button text
            buttonClass: "btn-outline-secondary",
            buttonWidth: "2.5em",
            textAlign: "center",
            autoDelay: 500, // ms holding before auto value change
            autoInterval: 100, // speed of auto value change
            boostThreshold: 15, // boost after these steps
            boostMultiplier: 10
        };
        Object.assign(config, options);

        const html = '<div class="input-group input-spinner">' +
            '<div class="input-group-prepend">' +
            '<button style="min-width: ' + config.buttonWidth + '" class="btn btn-decrement ' + config.buttonClass + '" type="button">' + config.decrementHtml + '</button>' +
            '</div>' +
            '<input style="text-align: ' + config.textAlign + '" class="input"/>' +
            '<div class="input-group-append">' +
            '<button style="min-width: ' + config.buttonWidth + '" class="btn btn-increment ' + config.buttonClass + '" type="button">' + config.incrementHtml + '</button>' +
            '</div>' +
            '</div>';

        this.each(function () {

            const $original = $(this);
            const originalWidth = $original.outerWidth();
            $original.hide();

            var autoDelayHandler = null;
            var autoIntervalHandler = null;

            const $inputGroup = $(html);
            const $buttonDecrement = $inputGroup.find(".btn-decrement");
            const $buttonIncrement = $inputGroup.find(".btn-increment");
            const $input = $inputGroup.find("input");

            const min = parseFloat($original.prop("min"));
            const max = parseFloat($original.prop("max"));
            const step = parseFloat($original.prop("step"));
            const decimals = parseInt($original.attr("data-decimals") ? $original.attr("data-decimals") : "0");

            const numberFormat = new Intl.NumberFormat(getLang(), {minimumFractionDigits: decimals});
            console.log(getLang());

            var value = parseFloat($original.val());

            $original.after($inputGroup);

            $input.css("width", originalWidth + (decimals * 9) + "px");
            $input.val(numberFormat.format(value));

            var boostCount = 0;

            onPointerDown($buttonDecrement[0], function () {
                decrement();
                resetTimer();
                autoDelayHandler = setTimeout(function () {
                    autoIntervalHandler = setInterval(function () {
                        if(boostCount > config.boostThreshold) {
                            decrement(config.boostMultiplier);
                        } else {
                            decrement();
                        }
                        boostCount++;
                    }, config.autoInterval);
                }, config.autoDelay);
            });

            onPointerDown($buttonIncrement[0], function () {
                increment();
                resetTimer();
                autoDelayHandler = setTimeout(function () {
                    autoIntervalHandler = setInterval(function () {
                        if(boostCount > config.boostThreshold) {
                            increment(config.boostMultiplier);
                        } else {
                            increment();
                        }
                        boostCount++;
                    }, config.autoInterval);
                }, config.autoDelay);
            });

            onPointerUp(document.body, function () {
                resetTimer();
            });

            function decrement(boost) {
                boost = boost ? boost : 1;
                value = Math.max(value - step * boost, min);
                $input.val(numberFormat.format(value));
            }

            function increment(boost) {
                boost = boost ? boost : 1;
                value = Math.min(value + step * boost, max);
                console.log(value, step, boost, step * boost);
                $input.val(numberFormat.format(value));
            }

            function resetTimer() {
                boostCount = 0;
                clearTimeout(autoDelayHandler);
                clearTimeout(autoIntervalHandler);
            }

        });

    };

    function onPointerUp(element, callback) {
        element.addEventListener("mouseup", function (e) {
            e.preventDefault();
            callback(e);
        });
        element.addEventListener("touchend", function (e) {
            e.preventDefault();
            callback(e);
        });
    }

    function onPointerDown(element, callback) {
        element.addEventListener("mousedown", function (e) {
            e.preventDefault();
            callback(e);
        });
        element.addEventListener("touchstart", function (e) {
            e.preventDefault();
            callback(e);
        });
    }

    function getLang() {
        if (navigator.languages !== undefined) {
            return navigator.languages[0];
        } else {
            return navigator.language;
        }
    }
}(jQuery));