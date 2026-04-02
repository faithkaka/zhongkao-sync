async function removeAvatar() {
        const uid = Storage.getUid();
        if (!uid) return alert('请先登录');
        if (!confirm('确定删除头像？')) return;
        try {
            // 只数据库删除引用，不删除存储桶文件
            const users = await Storage.getUsers();
            const user = users.find(u => u.id === uid);
            const updateRes = await Storage._client._client.update('users', uid, { avatar_url: null });
            console.log('Avatar removed:', updateRes);
            document.getElementById('avatar-preview').style.display = 'none';
            document.getElementById('avatar-placeholder').style.display = 'block';
            document.getElementById('current-user-avatar').style.display = 'none';
            document.getElementById('current-user-icon').style.display = 'inline-block';
            document.getElementById('upload-status').textContent = '✅ 头像已删除';
            showUserManager();
        } catch (e) {
            console.error('Remove avatar error:', e);
            document.getElementById('upload-status').textContent = '❌ 删除失败：' + e.message;
        }
    }