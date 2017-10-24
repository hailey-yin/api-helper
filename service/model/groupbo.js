/**
 * 项目分组BO
 * @param group
 * @constructor
 */
function Group(group){
    this.name = group.name;//分组名称
    this.id = group.id;//分组ID
    this.requests = [];//API列表
}

module.exports = Group;