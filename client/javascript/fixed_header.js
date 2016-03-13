console.log('test');
$(window).on("scroll", function(e) {
    if (this.scrollY > 75) {
        $('#fixed-header').addClass('fix-header');
    } else {
        $('#fixed-header').removeClass("fix-header");
    }
});