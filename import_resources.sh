#!/bin/bash
# ============================================================
# ============================================================
cd "$(dirname "$0")" || exit 1

SRC="${1:?用法: ./import_resources.sh <资源包目录>}"
[ -d "$SRC" ] || { echo "[✗] 目录不存在: $SRC"; exit 1; }

mkdir -p resource_cache
COUNT=0
SKIP=0

for f in "$SRC"/*; do
    [ -f "$f" ] || continue
    if [[ "$(basename "$f")" =~ ^_resources_[0-9a-f]{40,}$ ]]; then
        cp "$f" "resource_cache/$(basename "$f")" && COUNT=$((COUNT+1)) && continue
    fi
    h=$(sha1sum "$f" | cut -d' ' -f1)
    target="resource_cache/_resources_$h"
    if [ -f "$target" ] && [ -s "$target" ]; then
        SKIP=$((SKIP+1))
        continue
    fi
    cp "$f" "$target" && COUNT=$((COUNT+1))
done

echo "导入完成: 新增 $COUNT 个，跳过已有 $SKIP 个"
echo "当前缓存: $(ls resource_cache/_resources_* 2>/dev/null | wc -l) 个资源"
ls -lh resource_cache/_resources_* 2>/dev/null | head -20
