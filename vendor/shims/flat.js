(function() {
  var module = self['flat'];
  delete self['flat'];

  function vendorModule() {
    'use strict';

    return {
      'default': module,
      __esModule: true,
    };
  }

  define('flat', [], vendorModule);
})();
