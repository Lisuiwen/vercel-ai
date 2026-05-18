/**
 * 可以和`notify`一起使用回调函数。
 */
export type Callback<EVENT> = (event: EVENT) => PromiseLike<void> | void;
