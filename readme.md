# Geolocate and Autofill Address using Google Maps API

#### by [Aravindan Ve](http://github.com/aravindanve)

## Requires

* jQuery
* Google Maps JavaScript API
    
    ```html
    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp&signed_in=true&libraries=places"></script>
    ```

## Usage

* Include the script `location-autocomplete.js` 

* Initialize after document ready:

    ```javascript
    var autolocation = new LocationAutocomplete('input-id-to-autocomplete', 'auto-locate-button-id' /* optional */);
    ```

* Advanced Syntax:
    
    ```javascript
    var autolocation = new LocationAutocomplete('input-id-to-autocomplete', true, // select first on enter 
    {   
        // fills in self or 'input-id-to-autocomplete'
        0:  {components: ['_all:long_name']},

        // fills in only the listed components
        'target-autofill-input-id-1': {components: ['administrative_area_level_1:long_name', 'country:short_name']},

        // fills in all the address components returned by google maps api
        'target-autofill-input-id-2': {components: ['_all:long_name'], separator: ', '},

    }, 'auto-locate-button-id');
    ```
