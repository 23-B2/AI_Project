from flask import Flask, render_template, request, send_file, send_from_directory, jsonify
try:
	from werkzeug.utils import secure_filename
except:
	from werkzeug import secure_filename

import os

from src.project import get_transferred_file, get_noise_file
app = Flask(__name__)
#app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 #파일 업로드 용량 제한 단위:바이트

@app.errorhandler(404)
def page_not_found(error):
	app.logger.error(error)
	return render_template('page_not_found.html'), 404

#HTML 렌더링
@app.route('/')
def home_page():
	return render_template('upload_imgs.html')


transferred_status = {
	"name": "transfer",
    "status": "pending",  # or "completed"
    "transferred_filepath": "",
	"content_filepath": ""
}

noise_status  = {
	"name": "noise",
    "status": "pending",  # or "completed"
    "noise_filepath": ""
}

#파일 업로드 처리
@app.route('/fileUpload', methods = ['GET', 'POST'])
def upload_file():
	if request.method == 'POST':
		content_file = request.files['contentFile']
		style_file = request.files['styleFile']
	
		#저장할 경로 + 파일명
		content_filepath = './temp/content/' + secure_filename(content_file.filename)
		style_filepath = './temp/style/' + secure_filename(style_file.filename)

		# 파일 저장
		content_file.save(content_filepath)
		style_file.save(style_filepath)
	
		return jsonify({
			"content_filepath":content_filepath,
			"style_filepath":style_filepath
		})
	
@app.route('/getTransferredImage', methods=['POST'])
def get_transferred_image():
	content_filepath = request.form['content_filepath']
	style_filepath = request.form['style_filepath']
    # model running
	transferred_filepath = get_transferred_file(content_filepath, style_filepath)

	return jsonify({
	"name": "transfer",
    "status": "completed",
    "transferred_filepath": transferred_filepath,
	"content_filepath":content_filepath
})

@app.route('/getNoiseImage', methods = ['POST'])
def get_noise_image():
	content_file = request.form['content_filepath']
	style_transferred_file = request.form['transferred_filepath']
	p_value = request.form['p_value']

	# model running
	noise_filepath = get_noise_file(content_file, style_transferred_file, p_value)

	return jsonify({
	"name": "noise",
    "status": "completed",
    "noise_filepath": noise_filepath,
})

@app.route('/temp/transfer/<filename>')
def serve_transfer_file(filename):
    return send_from_directory(os.path.join('.', 'temp', 'transfer'), filename)

@app.route('/temp/output/<filename>')
def serve_output_file(filename):
    return send_from_directory(os.path.join('.', 'temp', 'output'), filename)

@app.route('/check_transferred_status')
def check_transferred_status():
    return jsonify(transferred_status)

@app.route('/checkNoiseStatus')
def check_noise_status():
    return jsonify(noise_status)


if __name__ == '__main__':
	#서버 실행
	app.run(host='0.0.0.0', port=8080, debug = True)