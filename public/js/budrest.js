/**
 * @author duanying
 */

$(function() {
	
	fix();

	//菜单hover事件
	$(".navagation>ul>li>a").hover(function() {
		if ($(this).next().length > 0) {
			$(this).next().stop().slideDown(200);
		}
	}, function() {
		if ($(this).next().length > 0) {
			$(this).next().stop().slideUp(200);
		}
	});
	$(".navagation>ul>li>ul").hover(function() {
		$(this).stop().slideDown(200);
	}, function() {
		$(this).stop().slideUp(200);
	});

	$(window).resize(function() {
		fix();
	});

});

/**
 * 页面自适应
 */
function fix(){
	var a = $(".head").outerHeight() + $(".foot").outerHeight();
	var b = $(window).height();
	$(".main-page").css("min-height", b - a);
}
