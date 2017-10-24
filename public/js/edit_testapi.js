/**
 * 编辑API里的测试功能
 * Created by CK on 2015/7/9.
 */
var editNum = -1;

// 测试时增加参数
function addEditPrameter() {
    editNum++;
    var parameter = "";
    parameter += '<tr id="para' + editNum + '">'
        + '<td><input style="width: 100%;" class="testPara" placeholder="参数名" id="paraTestName' + editNum + '"></td>'
        + '<td><input style="width: 100%;" class="testPara" placeholder="值" id="paraTestValue' + editNum + '"></td>'
        + '<td><a href="javascript:void(0)" style="width: 15%;" onclick="removeEditPara(' + editNum + ')">'
        + '<span class="glyphicon glyphicon-trash"></span></a></td></tr>';
    $("#testEditContent").append(parameter);
}

// 测试时删除参数
function removeEditPara(id) {
    $("#para" + id).remove();
}

// 判断PAI的参数是否存在。如果不存在则测试部分就不显示添加参数功能，反正亦然。
function checkPrameter() {
    var elements = $('#tableBody tr').find('td').length;
    if(elements > 0) {
        $('#tableTestOwn').show();
    } else {
        $('#tableTestOwn').hide();
    }
}

var nice = false;
$(document).ready(
    function() {
        nice = $(".addText").niceScroll({
            cursorcolor: "#cac6c1",
            cursorborder: "#cac6c1",
            cursorwidth: "4px"
        })
    }
);

//测试窗口弹出
function showEditTestAPI() {
    // 测试图标显示
    $("#contentTestHeadTilte").show(300);
    // 导进按钮隐藏
    $('#testResultDo').hide();
    // 以滑动方式显示 自定义动画
    $("[name='editTestButton']").hide(0, function () {
        $("#testEditApiContent").slideDown(300);
    });
    if(nice) {
        nice.hide();
    }
    $("html,body").animate({scrollTop: $("#testEditApiContent").offset().top - 80}, 300, function() {
        if(nice) {
            nice.resize();
            nice.show();
        }
    });

    // 初始化测试信息的方法和URL
    var testEditMethod = $('#apiMethod').val();
    var apiUrlsuffix = $('#apiUrlsuffix').val();
    var testEditUrl = $('#document').attr('urlprefix') + apiUrlsuffix;
    $("#testEditMethod").val(testEditMethod.toUpperCase(testEditMethod));
    $("#testEditUrl").val(testEditUrl);
    checkPrameter();

    $("#returnEditData").val('');
}


// 测试窗口关闭
function removeEditApiContent() {

    $("#testEditApiContent").slideUp(300,function(){
        $("[name='editTestButton']").show();
        if(nice) {
            nice.hide();
            nice.resize();
        }
    });
    // 测试图标隐藏
    $("#contentTestHeadTilte").hide();
}

// 测试请求
function sendTestEditMsg() {
    var testUrl = $("#testEditUrl").val();
    var testMethod = $("#testEditMethod").val();
    var testData = [];
    for (var i = 0; i <= editNum;i++){
        var re = new Array();
        if($("#paraTestName"+ i).val() == undefined){
            continue;
        }
        var key = $("#paraTestName"+ i).val();
        var value = $("#paraTestValue"+ i).val();

        // 判断如果是json格式，那么就不在加双引号，否则加
        if(isJSON(value)) {
            re.push('{"key":"'+key+'","value":'+ value +'}');
        } else {
            re.push('{"key":"'+key+'","value":"'+ value +'"}');
        }

        testData.push(re.join());
    }
    var testdata = '['+testData+']';
    $.ajax({
        type: "get",
        url: "api/apitest",
        data: {
            testurl: testUrl,
            testmethod: testMethod,
            testdata : testdata
        },
        success :function(data){
            var last=jsl.format.formatJson(JSON.stringify(data));
            $("#returnEditData").val(last);
            $("#returnEditData").niceScroll({
                    cursorcolor: "#cac6c1",
                    cursorborder: "#cac6c1",
                    cursorwidth: "4px"
            });
            // 导进按钮显示
            $('#testResultDo').show();
        }
    });
}

// 将测试结果导进“输出”、“成功示例”或“错误示例”中
function send2Example(num) {
    var resultData = $("#returnEditData").val();
    if(!resultData) {
        swal({
            title: "对不起，结果为空不能进行此次操作!",
            confirmButtonText: "确定"
        });
        return;
    } else {
        if(num === 1) { // 导进输出
            $('#outputSample').val(resultData);
        } else if(num === 2) { // 导进成功
            $('#trueSample').val(resultData);
        } else { // 导进错误
            $('#falseSample').val(resultData);
        }
    }
}
