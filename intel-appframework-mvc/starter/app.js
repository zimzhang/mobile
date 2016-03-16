

var app = new $.mvc.app();
app.loadControllers(["hello"]); //You can pass in array or a string.  You do not need to reference the .js extension.
app.listenHashChange(); //Listen to the hash change for routing
//app.setBaseDir("starter");
app.useHTML5History(true); //Use html5 history stack
//Now let's run code on app.ready and load the default action for the hello controller.
app.ready(function(){
    $.mvc.route("/hello"); //When the app launches, go to the default route for "hello"
});

$.mvc.addRoute("/foo/bar",function(d){
	alert("You can also do hash based routing - look at the console for data")
    console.log("bar",arguments,d);
});
