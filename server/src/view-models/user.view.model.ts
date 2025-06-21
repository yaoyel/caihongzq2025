/**
 * 用户视图模型
 * 用于API响应中的用户数据展示
 */
export class UserViewModel {
  /**
   * 用户ID
   */
  id: number;

  /**
   * 微信openid
   */
  openid: string;

  /**
   * 用户昵称
   */
  nickname: string;

  /**
   * 头像URL
   */
  avatarUrl: string;
 
  /**
   * 省份ID
   */
  provinceId?: number;

  /**
   * 分数
   */
  score?: number;

  /**
   * 首选科目
   */
  preferredSubjects?: string;

  /**
   * 次选科目
   */
  secondarySubjects?: string;

  /**
   * 录取类型
   */
  enrollType?: string;

  /**
   * 用户类型
   */
  userType: "child" | "adult";

  /**
   * 年龄
   */
  age: number;

  /**
   * 性别
   */
  gender: string; 

  /**
   * 订单总数
   */
  orderCount: number;

  /**
   * 量表答案总数
   */
  scaleAnswerCount: number;
} 