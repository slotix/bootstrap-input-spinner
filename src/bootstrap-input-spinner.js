/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/bootstrap-input-spinner
 * License: MIT, see file 'LICENSE'
 */

; (function ($) {
    "use strict"

    var spacePressed = false
    var originalVal = $.fn.val
    $.fn.val = function (value) {
        if (arguments.length >= 1) {
            if (this[0] && this[0]["input-spinner"] && this[0].setValue) {
                var element = this[0];
                setTimeout(function () {
                    element.setValue(value)
                })
            }
        }
        return originalVal.apply(this, arguments)
    }

    $.fn.InputSpinner = $.fn.inputSpinner = function (options) {

        var config = {
            decrementButton: "<i class='minus  icon'></i>", // button text
            incrementButton: "<i class='plus  icon'></i>", // ..
            buttonsClass: "ui icon attached button",
            buttonsWidth: "auto;",
            autoDelay: 500, // ms holding before auto value change
            autoInterval: 100, // speed of auto value change
            boostThreshold: 10, // boost after these steps
            boostMultiplier: "auto", // you can also set a constant number as multiplier
            locale: null // the locale for number rendering; if null, the browsers language is used
        }
        for (var option in options) {
            config[option] = options[option]
        }


        var html = '<div class="ui action input">' +

            '<button style="width: ' + config.buttonsWidth + '" class="left btn-decrement ' + config.buttonsClass + '" type="button">' + config.decrementButton + '</button>' +
            '<input class="ui action input" type="text" style="text-align: center; border-radius: 0px; margin-top:-1px; "' + '/>' +
            '<button style="width: ' + config.buttonsWidth + '" class="right btn-increment ' + config.buttonsClass + '" type="button">' + config.incrementButton + '</button>' +
            '</div>'

        // var html = '<div class="ui action input">' +
        // '<button class="ui button">-</button>'+
        //     '<input class="ui action input" type="text" style="text-align: center; border-radius: 0px; margin-top:-1px; width:45%"' + '/>' +
        //     '<button class="ui button">+</button>' +
        //     '</div>'


        var locale = config.locale || navigator.language || "en-US"

        this.each(function () {

            var $original = $(this)
            $original[0]["input-spinner"] = true
            $original.hide()

            var autoDelayHandler = null
            var autoIntervalHandler = null
            var autoMultiplier = config.boostMultiplier === "auto"
            var boostMultiplier = autoMultiplier ? 1 : config.boostMultiplier

            var $inputGroup = $(html)
            var $buttonDecrement = $inputGroup.find(".btn-decrement")
            var $buttonIncrement = $inputGroup.find(".btn-increment")
            var $input = $inputGroup.find("input")

            var min = null
            var max = null
            var step = null
            var stepMax = null
            var decimals = null
            var digitGrouping = null
            var numberFormat = null

            updateAttributes()

            var value = parseFloat($original[0].value)
            var boostStepsCount = 0

            // var prefix = $original.attr("data-prefix") || ""
            // var suffix = $original.attr("data-suffix") || ""

            // if (prefix) {
            //     var prefixElement = $('<span class="">' + prefix + '</span>')
            //     $inputGroup.find(".input-group-prepend").append(prefixElement)
            // }
            // if (suffix) {
            //     var suffixElement = $('<span class="">' + suffix + '</span>')
            //     $inputGroup.find(".input-group-append").prepend(suffixElement)
            // }


            $original[0].setValue = function (newValue) {
                setValue(newValue)
            }

            var observer = new MutationObserver(function () {
                updateAttributes()
                setValue(value, true)
            })
            observer.observe($original[0], { attributes: true })
            $original.after($inputGroup)

            setValue(value)

            $input.on("paste input change focusout", function (event) {
                var newValue = $input[0].value
                var focusOut = event.type === "focusout"
                newValue = parseLocaleNumber(newValue)
                setValue(newValue, focusOut)
                dispatchEvent($original, event.type)
            })

            onPointerDown($buttonDecrement[0], function () {
                stepHandling(-step)
            })
            onPointerDown($buttonIncrement[0], function () {
                stepHandling(step)
            })
            onPointerUp(document.body, function () {
                resetTimer()
            })

            function setValue(newValue, updateInput) {
                if (updateInput === undefined) {
                    updateInput = true
                }
                if (isNaN(newValue) || newValue === "") {
                    $original[0].value = ""
                    if (updateInput) {
                        $input[0].value = ""
                    }
                    value = NaN
                } else {
                    newValue = parseFloat(newValue)
                    newValue = Math.min(Math.max(newValue, min), max)
                    newValue = Math.round(newValue * Math.pow(10, decimals)) / Math.pow(10, decimals)
                    $original[0].value = newValue

                    var prefix = $original.attr("data-prefix") || ""
                    var suffix = $original.attr("data-suffix") || ""

                    if (updateInput) {
                        $input[0].value = prefix + ' ' + numberFormat.format(newValue) + ' ' + suffix
                    }

                    value = newValue
                }
            }

            function dispatchEvent($element, type) {
                if (type) {
                    setTimeout(function () {
                        var event
                        if (typeof (Event) === 'function') {
                            event = new Event(type, { bubbles: true })
                        } else { // IE
                            event = document.createEvent('Event')
                            event.initEvent(type, true, true)
                        }
                        $element[0].dispatchEvent(event)
                    })
                }
            }

            function stepHandling(step) {
                if (!$input[0].disabled && !$input[0].readOnly) {
                    calcStep(step)
                    resetTimer()
                    autoDelayHandler = setTimeout(function () {
                        autoIntervalHandler = setInterval(function () {
                            if (boostStepsCount > config.boostThreshold) {
                                if (autoMultiplier) {
                                    calcStep(step * parseInt(boostMultiplier, 10))
                                    if (boostMultiplier < 100000000) {
                                        boostMultiplier = boostMultiplier * 1.1
                                    }
                                    if (stepMax) {
                                        boostMultiplier = Math.min(stepMax, boostMultiplier)
                                    }
                                } else {
                                    calcStep(step * boostMultiplier)
                                }
                            } else {
                                calcStep(step)
                            }
                            boostStepsCount++
                        }, config.autoInterval)
                    }, config.autoDelay)
                }
            }

            function calcStep(step) {
                if (isNaN(value)) {
                    value = 0
                }
                setValue(Math.round(value / step) * step + step)
                dispatchEvent($original, "input")
                dispatchEvent($original, "change")
            }

            function resetTimer() {
                boostStepsCount = 0
                boostMultiplier = boostMultiplier = autoMultiplier ? 1 : config.boostMultiplier
                clearTimeout(autoDelayHandler)
                clearTimeout(autoIntervalHandler)
            }

            function updateAttributes() {
                // copy properties from original to the new input
                $input.prop("required", $original.prop("required"))
                $input.prop("placeholder", $original.prop("placeholder"))
                var disabled = $original.prop("disabled")
                var readonly = $original.prop("readonly")
                $input.prop("disabled", disabled)
                $input.prop("readonly", readonly)
                $buttonIncrement.prop("disabled", disabled || readonly)
                $buttonDecrement.prop("disabled", disabled || readonly)
                if (disabled || readonly) {
                    resetTimer()
                }
                //var originalClass = $original.prop("class")
                // var groupClass = ""
                // sizing
                // if (/form-control-sm/g.test(originalClass)) {
                //     groupClass = "input-group-sm"
                // } else if (/form-control-lg/g.test(originalClass)) {
                //     groupClass = "input-group-lg"
                // }
                // var inputClass = originalClass.replace(/form-control(-(sm|lg))?/g, "")
                // $inputGroup.prop("class", "input-group " + groupClass + " " + config.groupClass)
                // $input.prop("class", "form-control " + inputClass)
                //$input.prop("class", "form-control")

                // update the main attributes
                min = parseFloat($original.prop("min")) || 0
                max = isNaN($original.prop("max")) || $original.prop("max") === "" ? Infinity : parseFloat($original.prop("max"))
                step = parseFloat($original.prop("step")) || 1
                stepMax = parseInt($original.attr("data-step-max")) || 0
                var newDecimals = parseInt($original.attr("data-decimals")) || 0
                var newDigitGrouping = !($original.attr("data-digit-grouping") === "false")
                if (decimals !== newDecimals || digitGrouping !== newDigitGrouping) {
                    decimals = newDecimals
                    digitGrouping = newDigitGrouping
                    numberFormat = new Intl.NumberFormat(locale, {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals,
                        useGrouping: digitGrouping
                    })
                }
            }

            function parseLocaleNumber(stringNumber) {
                var numberFormat = new Intl.NumberFormat(locale)
                var thousandSeparator = numberFormat.format(1111).replace(/1/g, '')
                var decimalSeparator = numberFormat.format(1.1).replace(/1/g, '')
                return parseFloat(stringNumber
                    .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
                    .replace(new RegExp('\\' + decimalSeparator), '.')
                )
            }
        })

        return this
    }

    function onPointerUp(element, callback) {
        element.addEventListener("mouseup", function (e) {
            callback(e)
        })
        element.addEventListener("touchend", function (e) {
            callback(e)
        })
        element.addEventListener("keyup", function (e) {
            if (e.keyCode === 32) {
                spacePressed = false
                callback(e)
            }
        })
    }

    function onPointerDown(element, callback) {
        element.addEventListener("mousedown", function (e) {
            e.preventDefault()
            callback(e)
        })
        element.addEventListener("touchstart", function (e) {
            if (e.cancelable) {
                e.preventDefault()
            }
            callback(e)
        })
        element.addEventListener("keydown", function (e) {
            if (e.keyCode === 32 && !spacePressed) {
                spacePressed = true
                callback(e)
            }
        })
    }

}(jQuery))
