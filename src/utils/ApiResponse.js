class ApiResponse{
    constructor(statusCode , data, message = "Success(located in the ApiResponse)"){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400 // Sets success to true if statusCode is less than 400
    }
}

export {ApiResponse};