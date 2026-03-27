export default interface IExecutable {
  execute: (...args: any[]) => Promise<any>;
}
