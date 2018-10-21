/**
 * Jeli HTTP MOCK
 * TypeScript interface
 */

 export declare class jHTTP {
    request(url:String | jHttpApiModel, options?:jHttpApiModel);
    app():jHttpClientApi;
    interceptor:jInterceptor;
 }

 export interface jInterceptor {
    set(definition:interceptors):jInterceptor;
    get(type:String): Array<interceptors?>;
    resolve(type:String, options?:Object);
    registerHandler(name:String, handler: Funtion);
 }

 export interface interceptors {
     type:String;
     handler?:(options?:Object)=>{};
 }

 /**
  * JHTTPAPI Core CLASS
  */
 export declare class JHTTPAPI {
     set(definition: jHttpApiModel):JHTTPAPI;
     isExists(api: jHttpApiModel): Boolean;
     get(api: jHttpApiModel): jHttpApiModel;
     clear(api?: jHttpApiModel): void;
 }

 /**
  * jAp
  */
 export interface jHttpApiModel {
    url: String;
    method: String;
    controller?: (instance: jHttpRequestResponser) => {};
    response?: jApiModelResponse;
 }

 export interface jApiModelResponse {
    text: Any;
    status: Number;
    headers: Object;
 }

  /**
  * jHttpRequestResponser Instance
  */
 export interface jHttpRequestResponser {
     req:jHttpResponder;
     res: jHttpRequest;
 }

  /**
  * jHttpResponder Instance
  */
 export interface jHttpResponder {
     status(code:Any):jHttpResponder;
     headers(name:String, value:Any): jHttpResponder;
     responseText(response:Any): jHttpResponder;
     exit():void;
 }

 /**
  * jHttpRequest Instance
  */
 export interface jHttpRequest {
    getParam():Object?;
    getResponseText():Any;
    getHeaders():Any;
 }

 /**
  * jHttpClientApi Instance
  */
 export interface jHttpClientApi {
    get(url:String | jHttpApiModel, options?:jHttpApiModel): jHttpPromise;
    post(url:String | jHttpApiModel, options?:jHttpApiModel): jHttpPromise;
    put(url:String | jHttpApiModel, options?:jHttpApiModel): jHttpPromise;
    delete(url:String | jHttpApiModel, options?:jHttpApiModel): jHttpPromise;
    patch(url:String | jHttpApiModel, options?:jHttpApiModel): jHttpPromise;
 }

 export interface jHttpPromise {
    subscribe(callback:Function);
    then(success:Function, error?:Function): jHttpPromise;
    catch(callback:Function);
 }

 export declare class _promise {
     constructor(resolve:Function, reject?:Function);
 }