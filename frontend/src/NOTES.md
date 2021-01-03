conda create -n collage python=3.7

conda activate collage
pip3 install -r requirements.txt

var loopChildsDisableRenderablesOffScreen = function(children) {
for (let k in children) {
var child = children[k]
var pos = child.toGlobal(new PIXI.Point(0, 0))
child.visible =child.renderable= (pos.x > 0 && pos.y > 0 && pos.x < screen.width && pos.y < screen.height)
loopChildsDisableRenderablesOffScreen(child.children)
}
}

loopChildsDisableRenderablesOffScreen(stage.children)
render()
