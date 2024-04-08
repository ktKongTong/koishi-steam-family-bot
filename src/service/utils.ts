import {} from "koishi";

enum ReqResultStatus {
  Success,
  NotMatch,
  NetworkError
}

class NetReqResult<T> {
  data:T
  private status: ReqResultStatus
  constructor(data:T,status:ReqResultStatus) {
    this.data = data
    this.status = status
  }
  successOr(data:T) {
    if(this.isSuccess()) {
      return this.data
    }
    return data
  }
  isSuccess () {
    return this.status === ReqResultStatus.Success
  }

  isNetworkError() {
    return this.status === ReqResultStatus.NetworkError
  }

  isNotMatch() {
    return this.status === ReqResultStatus.NotMatch
  }

}

export const wrapperErr = async<T>(block:()=>T) => {
  try {
    return await block()
  }catch (e) {
    console.log(e)
    return null
  }
}

