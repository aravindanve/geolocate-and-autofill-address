(function ($, window) {
    /**
     * LocationAutocomplete class
     * helper class for location field (and auto geolocate button) with google places api
     * by @aravindanve
     *
     * syntax
     * LocationAutocomplete(id [, geolocateButtonId])
     * LocationAutocomplete(id [, onEnterSelectFirst] [, geolocateButtonId])
     * LocationAutocomplete(id [, autoFillTargetFields] [, geolocateButtonId])
     * LocationAutocomplete(id [, onEnterSelectFirst] [, autoFillTargetFields] [, geolocateButtonId])
     * 
     * @param {String} id: id of the <input> element to autocomplete.
     * @param {Boolean} onEnterSelectFirst: selects first value on enter, default: true
     * @param {Object} autoFillTargetFields: {targetFieldId: {components: ['street_number:short_name'], separator: ', '}}, 
     *                                       to autofill self, pass targetFieldId as 0, default: self
     * @param {String} geolocateButtonId: id of the clickable element to that triggers geolocate, and fills in the address automatically.
     * 
     */
    function LocationAutocomplete(id, onEnterSelectFirst, autoFillTargetFields, geolocateButtonId) {
        var $elem = $('#' + id).first();
        if (!($elem.length 
            && ($elem.prop('tagName').toLowerCase() === 'input')
            && ($elem.prop('type').toLowerCase() === 'text'))) {
            throw new Error('<input> with id: ' + id + ' does not exist');
        }
        this.htmlInputElement = $elem.get(0);
        this.autocomplete = new google.maps.places.Autocomplete(
            this.htmlInputElement, {types: ['geocode']});
        this.geocoder = new google.maps.Geocoder();
        this.autoFillAddressForm = [];
        this.requiredAddressTypes = [];
        if (typeof onEnterSelectFirst !== 'boolean') {
            // skip onEnterSelectFirst parameter
            geolocateButtonId = autoFillTargetFields;
            autoFillTargetFields = onEnterSelectFirst;
            onEnterSelectFirst = true;
        }
        if (typeof autoFillTargetFields === 'string' &&
            typeof geolocateButtonId === 'undefined') {
            // skip autoFillTargetFields parameter
            geolocateButtonId = autoFillTargetFields;
            autoFillTargetFields = null;
        }
        if (typeof autoFillTargetFields === 'undefined' ||
            autoFillTargetFields === null) {
            autoFillTargetFields = {};
            autoFillTargetFields[id] = {components: ['_all:long_name']};
        }
        for (targetId in autoFillTargetFields) {
            var $targetElem = (targetId == 0? $elem : $('#' + targetId).first());
            var fillComponents = [];
            var separator = typeof autoFillTargetFields[targetId].separator != 'undefined'? 
                autoFillTargetFields[targetId].separator : ', ';
            for (var i = 0; i < autoFillTargetFields[targetId].components.length; i++) {
                var componentParts = autoFillTargetFields[targetId].components[i].split(':');
                var addressType, addressStyle;
                if (typeof componentParts[0] != 'undefined') {
                    addressType = componentParts[0];
                }
                if (typeof componentParts[1] != 'undefined') {
                    addressStyle = LocationAutocomplete.addressStyles[
                        componentParts[1]];
                } else {
                    addressStyle = LocationAutocomplete.addressStyles['long_name'];
                }
                var addressComponent = {type: addressType, style: addressStyle};
                fillComponents.push({component: addressComponent});
                this.requiredAddressTypes.push(addressComponent);
            }
            this.autoFillAddressForm.push({
                $elem: $targetElem, 
                fill: fillComponents, 
                separator: separator
            });
        }
        var objRef = this;
        google.maps.event.addListener(
            this.autocomplete, 'place_changed', function () {
                objRef.fillInAddress(); });
        if (typeof geolocateButtonId != 'undefined') {
            var $geoBtn = $('#' + geolocateButtonId).first();
            if ($geoBtn.length) {
                $($geoBtn).on('click', function() { 
                    $elem.val('');
                    objRef.geolocate();
                });
            }
        }
        if (onEnterSelectFirst) {
            $(document).on('keypress', function (e) {
                if (e.which === 13 && $elem.is(':focus')) {
                    objRef.selectFirstResult();
                }
            });
        }
        this.clearAddressFields();
    }
    LocationAutocomplete.addressStyles = {
        long_name: 'long_name', 
        short_name: 'short_name'
    };
    LocationAutocomplete.prototype = {
        clearAddressFields: function () {
            for (var i = 0; i < this.autoFillAddressForm.length; i++) {
                this.autoFillAddressForm[i].$elem.val('');
                this.autoFillAddressForm[i].$elem.removeAttr('disabled');
            }
            return true;
        },
        fillInAddress: function (place) {
            var place = place || this.autocomplete.getPlace();
            var address_components_dict = {};
            this.clearAddressFields();
            if (!this.autoFillAddressForm.length) {
                return false;
            }
            if ((typeof place === 'undefined') || (typeof place.address_components === 'undefined')) {
                return false;
            }
            for (var i = 0; i < place.address_components.length; i++) {
                var addressType = place.address_components[i].types[0];
                var isRequired = [];
                for (var j = 0; j < this.requiredAddressTypes.length; j++) {
                    if (addressType == this.requiredAddressTypes[j].type) {
                        isRequired.push(this.requiredAddressTypes[j].style);
                    }
                }
                for (var j = 0; j < isRequired.length; j++) {
                    address_components_dict[addressType + ':' + isRequired[j]] =
                        place.address_components[i][isRequired[j]];
                }
            }
            for (var i = 0; i < this.autoFillAddressForm.length; i++) {
                var val = [];
                for (var j = 0; j < this.autoFillAddressForm[i].fill.length; j++) {
                    if (this.autoFillAddressForm[i].fill[j].component.type === '_all') {
                        for (var k = 0; k < place.address_components.length; k++) {
                            val.push(place.address_components[k][
                                this.autoFillAddressForm[i].fill[j].component.style]);
                        }
                        continue;
                    }
                    var lookup = this.autoFillAddressForm[i].fill[j].component.type 
                        + ':' + this.autoFillAddressForm[i].fill[j].component.style;
                    if (typeof address_components_dict[lookup] != 'undefined') {
                        val.push(address_components_dict[lookup]);
                    }
                }
                this.autoFillAddressForm[i].$elem.val(
                    val.join(this.autoFillAddressForm[i].separator));
            }
        },
        geolocate: function () {
            if (navigator.geolocation) {
                var objRef = this;
                navigator.geolocation.getCurrentPosition(function (position) {
                    var geolocation = new google.maps.LatLng(
                        position.coords.latitude, position.coords.longitude);
                    var circle = new google.maps.Circle({
                        center: geolocation,
                        radius: position.coords.accuracy,
                    });
                    var latlng = circle.getCenter();
                    objRef.getAddressAtLatLng(latlng);
                    // objRef.autocomplete.setBounds(circle.getBounds());
                    // objRef.fillInAddress();
                });
            }
        },
        getAddressAtLatLng: function (latlng) {
            // var latlng = new google.maps.LatLng(lat, lng);
            var objRef = this;
            this.geocoder.geocode({'location': latlng}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    console.log(results);
                    if (results[1]) {
                        // console.log(results[1]);
                        objRef.fillInAddress(results[1]);
                    } else {
                        window.alert('No results found');
                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
          });
        },
        selectFirstResult: function () {
            var objRef = this;
            var firstResult = $('.pac-container .pac-item:first').text();
            console.log(firstResult);
            this.geocoder.geocode({'address': firstResult}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    console.log(results);
                    if (results[0]) {
                        // console.log(results[1]);
                        objRef.fillInAddress(results[0]);
                    } else {
                        // do nothing
                    }
                } else {
                    // do nothing
                }
            });
        },
    };

    window.LocationAutocomplete = LocationAutocomplete;

})(jQuery, window);

// eof