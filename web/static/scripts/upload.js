$(document).ready(function() {
    let pValue = 0.07; // pValue를 전역으로 설정하여 다른 함수에서도 사용 가능하게 함
    
    const defaultTransferredImageUrl = "/static/images/default.png";
    const defaultUploadImageUrl = "/static/images/upload.png";
    const waitingImageUrl = "/static/images/waiting.png";

    $("#contentPreview").attr("src", defaultUploadImageUrl);
    $("#stylePreview").attr("src", defaultUploadImageUrl);
    $("#transferredPreview").attr("src", defaultTransferredImageUrl);
    $("#noisePreview").attr("src", defaultTransferredImageUrl);

    function updateTransferredPreview() {
        const contentFile = $("#contentFileInput")[0].files[0];
        const styleFile = $("#styleFileInput")[0].files[0];
        if (contentFile && styleFile) {           
            $("#transferredPreview").attr("src", defaultUploadImageUrl);
        } else {
            $("#transferredPreview").attr("src", defaultTransferredImageUrl);
        }
    }

    $("#contentFileInput").change(updateTransferredPreview);
    $("#styleFileInput").change(updateTransferredPreview);

    $("form").on("submit", function(event) {
        event.preventDefault();
        const userInput = prompt("필터의 강도를 입력하세요. (0.01 ~ 0.1)");
        if (userInput !== null) {
            const floatValue = parseFloat(userInput);
            if (floatValue >= 0.01 && floatValue <= 0.1) {
                pValue = floatValue;  // Update pValue
                console.log("User correctly entered value:", pValue);
            } else {
                alert("디폴트 값 0.07을 사용하겠습니다.");
                pValue = 0.07; // Set to default value
            }
        }
        const contentFile = $("#contentFileInput")[0].files[0];
        const styleFile = $("#styleFileInput")[0].files[0];

        if (contentFile && styleFile) {
            $("#transferredPreview").attr("src", waitingImageUrl);
            $("#noisePreview").attr("src", waitingImageUrl);

            var formData = new FormData(this);
            formData.append("p_value", pValue); // 여기서 pValue를 사용

            $.ajax({
                url: "/fileUpload",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(data) {
                    $.post("/getTransferredImage", {
                        content_filepath: data.content_filepath,
                        style_filepath: data.style_filepath
                    }, function(response) {
                        if (response.status === "completed") {
                            $("#transferredPreview").attr("src", response.transferred_filepath);
                            $.post("/getNoiseImage", {
                                content_filepath: response.content_filepath,
                                transferred_filepath: response.transferred_filepath,
                                p_value: pValue // Make sure pValue is defined globally or fetch it again
                            }, function(noiseResponse) {
                                if (noiseResponse.status === "completed") {
                                    const noiseFilepath = noiseResponse.noise_filepath;
                                    // Preview the image
                                    $("#noisePreview").attr("src", noiseFilepath);
                                    // Automatically download the image
                                    downloadImage(noiseFilepath, "output_image.png");
                                } else {
                                    setTimeout(checkNoiseStatus, 2000);
                                }
                            });
                        } else {
                            setTimeout(checkTransferredStatus, 2000);
                        }
                    });

                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert("Error occurred: " + textStatus + " " + errorThrown);
                }
            });
        }
    });
});


function checkTransferredStatus() {
    $.get("/check_transferred_status", function(data) {
        if (data.status === "completed") {
            $("#transferredPreview").attr("src", "/temp/transfer/" + data.filename);
        } else {
            $("#transferredPreview").attr("src", waitingImageUrl);
            setTimeout(checkTransferredStatus, 2000);
        }
    });
}

function checkNoiseStatus() {
    $.get("/checkNoiseStatus", function(data) {
        if (data.status === "completed") {
            $("#noisePreview").attr("src", "/temp/output/" + data.filename);
        } else {
            $("#noisePreview").attr("src", waitingImageUrl);
            setTimeout(checkNoiseStatus, 2000);
        }
    });
}

function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            $("#" + previewId).attr("src", e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        $("#" + previewId).attr("src", "/static/images/upload.png");
    }
}

function downloadImage(url, filename) {
    fetch(url).then(response => response.blob()).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}