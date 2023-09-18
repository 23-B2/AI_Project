$(document).ready(function() {
    const defaultTransferredImageUrl = "/static/images/default.png"; // New default image for transferredPreview
    const defaultUploadImageUrl = "/static/images/upload.png"; // Old default image for content and style images
    const waitingImageUrl = "/static/images/waiting.png";  // Image shown during waiting

    // Set default images initially
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

    // Update transferredPreview whenever files are changed
    $("#contentFileInput").change(updateTransferredPreview);
    $("#styleFileInput").change(updateTransferredPreview);

    $("form").on("submit", function(event) {
        event.preventDefault();

        // Check if both images are uploaded
        const contentFile = $("#contentFileInput")[0].files[0];
        const styleFile = $("#styleFileInput")[0].files[0];

        if (contentFile && styleFile) {
            const waitingImageUrl = "/static/images/waiting.png";  // Flask의 url_for에 해당하는 경로

            // Style Transfer Image와 Output Image를 waiting.png로 설정
            $("#transferredPreview").attr("src", waitingImageUrl);
            $("#noisePreview").attr("src", waitingImageUrl);
            
            var formData = new FormData(this);

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

                            // get_noise_image 함수 호출
                            $.post("/getNoiseImage", {
                                content_filepath: response.content_filepath,
                                transferred_filepath: response.transferred_filepath
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
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

