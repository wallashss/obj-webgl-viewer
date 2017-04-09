function Ajax()
{
	var self  = this;
	
	var ajax = {};
	ajax.x = function () 
	{
		if (typeof XMLHttpRequest !== 'undefined') 
		{
			return new XMLHttpRequest();
		}
		var versions = [
			"MSXML2.XmlHttp.6.0",
			"MSXML2.XmlHttp.5.0",
			"MSXML2.XmlHttp.4.0",
			"MSXML2.XmlHttp.3.0",
			"MSXML2.XmlHttp.2.0",
			"Microsoft.XmlHttp"
		];

		var xhr;
		for (var i = 0; i < versions.length; i++) 
		{
			try 
			{
				xhr = new ActiveXObject(versions[i]);
				break;
			} 
			catch (e) 
			{
			}
		}
		return xhr;
	};

	ajax.send = function (url, callback, method, data, isJson, async) 
	{
		if (async === undefined) 
		{
			async = true;
		}
		var x = ajax.x();
		x.open(method, url, async);
		x.onreadystatechange = function () 
		{
			if (x.readyState == 4) 
			{
				callback(x.responseText)
			}
		};
		if (method == 'POST') 
		{
			if(isJson)
			{
				x.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
			}
			else
			{
				x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			}
		}
		if(method == 'GET')
		{
			x.setRequestHeader('Content-type', 'application/text');
		}
		x.send(data)
	};

	ajax.get = function (url, data, callback, async) 
	{
		var query = [];
		for (var key in data) 
		{
			query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
		}
		ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, false, async);
	};

	ajax.post = function (url, data, callback, async)
	{
		var query = [];
		for (var key in data) 
		{
			query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
		}
		ajax.send(url, callback, 'POST', query.join('&'), false, async)
	};
	
	ajax.postJson = function (url, data, callback, async)
	{
		ajax.send(url, callback, 'POST', JSON.stringify(data), true, async)
	};
	
	this.get = function (url, data, callback, async)
	{
		ajax.get(url, data, callback, async);
	};
	
	this.post = function (url, data, callback, async)
	{
		ajax.post(url, data, callback, async);
	};
	
	this.postJson = function (url, data, callback, async)
	{
		ajax.postJson(url, data, callback, async);
	};
}

var ajax = new Ajax();
