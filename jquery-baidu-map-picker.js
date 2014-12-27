(function ($) {
    $.fn.baiduMapPicker = function (options) {
        options = $.extend({}, $.fn.baiduMapPicker.defaults, options);
        var $els = this;

        window.BMap_loadScriptTime = (new Date).getTime();
        $.getScript('http://api.map.baidu.com/getscript?v=2.0&ak=' + options.ak, function () {
            $els.each(function () {
                var map = new BMap.Map(this.id);
                var point = new BMap.Point(options.lng, options.lat);
                map.enableScrollWheelZoom();
                map.enableInertialDragging();
                map.centerAndZoom(point, 12);

                // 添加控件和比例尺
                var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});// 左上角，添加比例尺
                var top_left_navigation = new BMap.NavigationControl();  //左上角，添加默认缩放平移控件
                /*缩放控件type有四种类型: BMAP_NAVIGATION_CONTROL_SMALL：仅包含平移和缩放按钮；BMAP_NAVIGATION_CONTROL_PAN:仅包含平移按钮；BMAP_NAVIGATION_CONTROL_ZOOM：仅包含缩放按钮*/
                map.addControl(top_left_control);
                map.addControl(top_left_navigation);

                // 设置标注
                var marker = new BMap.Marker(point);
                map.addOverlay(marker);
                marker.enableDragging();
                marker.addEventListener('dragend', function (e) {
                    getPointInfo(e.point);
                });

                // 设置标注文字
                var label = new BMap.Label("请拖动红点定位", {offset: new BMap.Size(20, -10)});
                marker.setLabel(label);

                // 输入地址自动完成
                initAutocomplete();

                // 更新地址信息
                var geoc = new BMap.Geocoder();

                function getPointInfo(point, updateLocalityEl) {
                    geoc.getLocation(point, function (rs) {
                        var comps = rs.addressComponents;
                        updateElVal('latEl', point.lat);
                        updateElVal('lngEl', point.lng);
                        updateElVal('addressEl', rs.address);
                        updateElVal('provinceEl', comps.province);
                        updateElVal('cityEl', comps.province != comps.city ? comps.city : comps.district);
                        updateLocalityEl !== false && updateElVal('localityEl', (comps.province != comps.city ? comps.district : '') + comps.street + comps.streetNumber);
                    });
                }

                function updateElVal(name, val) {
                    if (options[name]) {
                        if (name == 'provinceEl' || name == 'cityEl') {
                            val = removeSuffix(val, ['省', '市', '自治区']);
                        }
                        $(options[name]).val(val);
                        options.updateVal && options.updateVal(name, val);
                    }
                }

                /**
                 * 移除字符串结尾内容
                 */
                function removeSuffix(data, suffixs) {
                    for (var i in suffixs) {
                        // @link http://stackoverflow.com/questions/280634/endswith-in-javascript
                        if (data.indexOf(suffixs[i], data.length - suffixs[i].length) !== -1) {
                            return data.slice(0, -suffixs[i].length);
                        }
                    }
                    return data;
                }

                // 输入地址自动完成
                function initAutocomplete() {
                    var $el = $(options.autocompleteEl);
                    var origValue = $el.val();
                    var ac = new BMap.Autocomplete({
                        input: $el[0],
                        location: map
                    });
                    ac.setInputValue(origValue);

                    ac.addEventListener('onconfirm', function (e) {
                        // FIXME 返回的province为空
                        var comps = e.item.value;
                        var locality = comps.district + comps.street + comps.streetNumber;
                        var address = comps.province + comps.city + locality;
                        var searchAddress = address + comps.business;

                        var local = new BMap.LocalSearch(map, {
                            onSearchComplete: function (result) {
                                // 获取第一个智能搜索的结果
                                var point = result.getPoi(0).point;

                                getPointInfo(point, false);

                                marker.setPosition(point);
                                map.panTo(point);
                            }
                        });
                        local.search(searchAddress);
                    });
                }
            });
        });
    };

    $.fn.baiduMapPicker.defaults = {
        ak: '',
        lat: '22.546054',
        lng: '114.025974',
        addressEl: null,
        provinceEl: null,
        cityEl: null,
        localityEl: null,
        latEl: null,
        lngEl: null,
        autocompleteEl: null,
        updateVal: null
    };
}(jQuery));