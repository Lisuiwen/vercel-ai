/**
 * 可以与“notify”一起使用的回调函数。
 */
export type Callback<EVENT> = (event: EVENT) => PromiseLike<void> | void;
