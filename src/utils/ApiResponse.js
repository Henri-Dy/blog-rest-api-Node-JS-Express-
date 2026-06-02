class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  static created(res, data = null, message = 'Resource created') {
    return this.success(res, data, message, 201);
  }

  static paginated(res, data, pagination, message = 'Success', meta = {}) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      ...meta,
    });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;