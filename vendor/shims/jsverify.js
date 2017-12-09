(function() {
  function vendorModule() {
    'use strict';

    var jsc = self.jsc;
    delete self.jsc;

    return {
      'default': jsc,
      __esModule: true,
    };
  }

  define('jsverify', [], vendorModule);
})();
