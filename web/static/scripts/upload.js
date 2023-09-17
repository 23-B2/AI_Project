$(document).ready(function() {
    $("form").on("submit", function(event) {
        event.preventDefault();

        var formData = new FormData(this);

        $.ajax({
            url: "/fileUpload",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                // get_transferred_image 함수 호출
                $.post("/getTransferredImage", {
                    content_filepath: data.content_filepath,
                    style_filepath: data.style_filepath
                }, function(response) {
                    if (response.status === "completed") {
                        $("#transferredPreview").attr("src", response.transferred_filepath);
                        
                        // get_noise_image 함수 호출
                        $.post("/getNoiseImage", {
                            content_filepath:response.content_filepath,
                            transferred_filepath:response.transferred_filepath
                        }, function(noiseResponse) {
                            if (noiseResponse.status === "completed") {
                                $("#noisePreview").attr("src", noiseResponse.noise_filepath);
                            } else {
                                // 2초마다 상태 확인
                                setTimeout(checkNoiseStatus, 2000);
                            }
                        });
                    } else {
                        // 2초마다 상태 확인 for style transferred image
                        setTimeout(checkTransferredStatus, 2000);
                    }
                });
            },
            error: function() {
                alert("Error occurred. Please try again.");
            }
        });
    });
});

function checkTransferredStatus() {
    $.get("/check_transferred_status", function(data) {
        if (data.status === "completed") {
            $("#transferredPreview").attr("src", "/temp/transfer/" + data.filename);
        } else {
            // 2초마다 상태 확인
            setTimeout(checkTransferredStatus, 2000);
        }
    });
}

function checkNoiseStatus() {
    $.get("/checkNoiseStatus", function(data) {
        if (data.status === "completed") {
            $("#noisePreview").attr("src", "/temp/output/" + data.filename);
        } else {
            // 2초마다 상태 확인
            setTimeout(checkNoiseStatus, 2000);
        }
    });
}

function previewImage(input, previewId, buttonId) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        document.getElementById(previewId).src = "/static/images/upload.png";
    }
}