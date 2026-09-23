(function () {

    const adminToken = localStorage.getItem("adminToken");

    const adminEmail = localStorage.getItem("adminEmail");


    if (!adminToken || !adminEmail) {

        window.location.href = "../pages/admin-login.html";

        return;
    }


    window.adminLogout = function () {

        localStorage.removeItem("adminToken");

        localStorage.removeItem("adminEmail");

        localStorage.removeItem("adminId");


        window.location.href = "../pages/admin-login.html";
    };


})();